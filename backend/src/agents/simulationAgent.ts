import { query, execute } from '../config/database';

/**
 * CrisisSimulationAgent — What-if digital-twin engine (demo/synthetic).
 * Simulates crisis scenarios against REAL current capacity from the database.
 */

export interface SimulationParams {
  patients?: number;
  windowMinutes?: number;
  criticalFraction?: number; // 0-1
}

export interface SimulationResultData {
  bed_demand: number;
  icu_demand: number;
  doctor_workload_delta: number;
  medicine_demand_units: number;
  ambulances_required: number;
  capacity_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  predicted_state: Record<string, unknown>;
  recommendations: Array<{ agent: string; action: string; priority: string }>;
}

const SCENARIOS: Record<string, { name: string; defaults: SimulationParams }> = {
  ROAD_ACCIDENT: { name: 'Major Road Accident', defaults: { patients: 10, windowMinutes: 30, criticalFraction: 0.4 } },
  ICU_CAPACITY_LOSS: { name: 'ICU Capacity -30%', defaults: { patients: 0, windowMinutes: 0, criticalFraction: 0 } },
  DOCTOR_SHORTAGE: { name: 'Doctor Shortage', defaults: { patients: 0, windowMinutes: 0, criticalFraction: 0 } },
  MEDICINE_STOCKOUT: { name: 'Pharmacy Stockout — Critical Meds', defaults: { patients: 0, criticalFraction: 0 } },
  AMBULANCE_SHORTAGE: { name: 'Ambulance Shortage', defaults: { patients: 0, windowMinutes: 0, criticalFraction: 0 } },
  CUSTOM_SURGE: { name: 'Custom Patient Surge', defaults: { patients: 20, windowMinutes: 30, criticalFraction: 0.35 } },
};

export function listScenarios() {
  return Object.entries(SCENARIOS).map(([key, s]) => ({ key, name: s.name, defaults: s.defaults }));
}

/** Current capacity snapshot used as the simulation baseline. */
async function currentCapacity() {
  const [beds] = await query<any[]>(
    `SELECT COUNT(*) total,
            SUM(CASE WHEN status='AVAILABLE' THEN 1 ELSE 0 END) available,
            SUM(CASE WHEN status='OCCUPIED' THEN 1 ELSE 0 END) occupied,
            SUM(CASE WHEN status='MAINTENANCE' THEN 1 ELSE 0 END) maintenance
     FROM beds`
  );
  const icu = await query<any[]>(
    `SELECT COUNT(*) total, SUM(CASE WHEN status='AVAILABLE' THEN 1 ELSE 0 END) available
     FROM beds b JOIN wards w ON w.ward_id = b.ward_id
     WHERE b.bed_type='ICU' OR w.ward_type='ICU'`
  );
  const [meds] = await query<any[]>('SELECT COALESCE(SUM(quantity),0) units FROM medicines WHERE status="AVAILABLE"');
  const doctors = await query<any[]>(
    `SELECT COUNT(*) total,
            SUM(CASE WHEN availability_status='AVAILABLE' THEN 1 ELSE 0 END) available
     FROM doctors`
  );
  return {
    beds: { total: Number(beds.total), available: Number(beds.available), occupied: Number(beds.occupied), maintenance: Number(beds.maintenance) },
    icu: { total: Number(icu[0].total), available: Number(icu[0].available) },
    medicines: { units: Number(meds.units) },
    doctors: { total: Number(doctors[0].total), available: Number(doctors[0].available) },
  };
}

export async function runSimulation(scenarioKey: string, params: SimulationParams, userId: number | null) {
  const scenario = SCENARIOS[scenarioKey] || SCENARIOS.CUSTOM_SURGE;
  const p = { ...scenario.defaults, ...params };
  const cap = await currentCapacity();

  const patients = Math.max(0, p.patients ?? 0);
  const criticalCount = Math.round(patients * (p.criticalFraction ?? 0.35));
  const generalCount = patients - criticalCount;

  let bedDemand = 0, icuDemand = 0, medDemand = 0, ambulances = 0, doctorDelta = 0;
  const predicted: Record<string, unknown> = {};

  if (scenarioKey === 'ROAD_ACCIDENT' || scenarioKey === 'CUSTOM_SURGE') {
    bedDemand = patients;
    icuDemand = criticalCount;
    medDemand = Math.round(patients * 3);
    ambulances = Math.ceil(patients / 3);
    doctorDelta = Math.min(100, cap.doctors.total > 0 ? Math.round((patients / cap.doctors.total) * 45) : 100);

    predicted.surgePatients = patients;
    predicted.window = `${p.windowMinutes} minutes`;
    predicted.criticalCases = criticalCount;
    predicted.generalCases = generalCount;
  } else if (scenarioKey === 'ICU_CAPACITY_LOSS') {
    const lost = Math.max(1, Math.round(cap.icu.total * 0.3));
    icuDemand = lost; bedDemand = lost;
    predicted.icuBedsLost = lost;
  } else if (scenarioKey === 'DOCTOR_SHORTAGE') {
    doctorDelta = 40;
    predicted.doctorsUnavailable = Math.max(1, Math.round(cap.doctors.available * 0.4));
  } else if (scenarioKey === 'MEDICINE_STOCKOUT') {
    medDemand = Math.round(cap.medicines.units * 0.8);
    predicted.medicineUnitsLost = medDemand;
  } else if (scenarioKey === 'AMBULANCE_SHORTAGE') {
    ambulances = Math.max(2, Math.round(cap.doctors.available * 0.5));
    predicted.ambulancesLost = ambulances;
  }

  // Capacity risk calculation
  const icuAfter = Math.max(0, cap.icu.available - icuDemand);
  const bedsAfter = Math.max(0, cap.beds.available - bedDemand);
  let risk: SimulationResultData['capacity_risk'] = 'LOW';
  if (icuAfter === 0 && icuDemand > 0) risk = 'CRITICAL';
  else if (bedsAfter === 0 && bedDemand > 0) risk = 'CRITICAL';
  else if (icuAfter <= 1 && icuDemand > 0) risk = 'HIGH';
  else if (bedsAfter <= 2 && bedDemand > 0) risk = 'HIGH';
  else if (doctorDelta >= 60) risk = 'HIGH';

  predicted.bedsAvailableAfter = bedsAfter;
  predicted.icuAvailableAfter = icuAfter;
  predicted.baseline = cap;

  // Agent action plan
  const recommendations: SimulationResultData['recommendations'] = [];
  if (icuDemand > cap.icu.available) {
    recommendations.push({ agent: 'Bed Allocation Agent', action: `Reserve remaining ICU beds; activate HDU overflow (short by ${icuDemand - cap.icu.available})`, priority: 'CRITICAL' });
  }
  if (bedDemand > cap.beds.available) {
    recommendations.push({ agent: 'Bed Allocation Agent', action: `Expedite discharges; open overflow ward (short ${bedDemand - cap.beds.available} beds)`, priority: 'CRITICAL' });
  }
  if (medDemand > cap.medicines.units * 0.4) {
    recommendations.push({ agent: 'Medicine Prediction Agent', action: 'Pre-position emergency pharmacy stock for surge', priority: 'HIGH' });
  }
  if (doctorDelta >= 40) {
    recommendations.push({ agent: 'Doctor Scheduling Agent', action: `Recall off-duty doctors; redistribute appointments (workload +${doctorDelta}%)`, priority: 'HIGH' });
  }
  if (ambulances > 0) {
    recommendations.push({ agent: 'Ambulance/Transfer Agent', action: `Stage ${ambulances} ambulances at receiving bays; brief crews`, priority: 'MODERATE' });
  }
  recommendations.push({ agent: 'Orchestrator Agent', action: 'Coordinate all agents; require human approval before executing plan', priority: 'HIGH' });

  const result: SimulationResultData = {
    bed_demand: bedDemand, icu_demand: icuDemand, doctor_workload_delta: doctorDelta,
    medicine_demand_units: medDemand,
    ambulances_required: ambulances, capacity_risk: risk,
    predicted_state: predicted, recommendations,
  };

  // Persist simulation + results
  const simIns = await execute(
    'INSERT INTO simulations (scenario_name, scenario_key, parameters, ran_by) VALUES (?,?,?,?)',
    [scenario.name, scenarioKey, JSON.stringify(p), userId]
  );
  await execute(
    `INSERT INTO simulation_results
       (simulation_id, bed_demand, icu_demand, doctor_workload_delta, medicine_demand_units, ambulances_required, capacity_risk, predicted_state, recommendations)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [simIns.insertId, bedDemand, icuDemand, doctorDelta, medDemand, ambulances, risk,
     JSON.stringify(predicted), JSON.stringify(recommendations)]
  );

  // Agent feed entry
  await execute(
    `INSERT INTO ai_agent_logs (agent_id, agent_name, event_type, message, reference_type, reference_id, created_by)
     VALUES ('crisis', 'Crisis Simulation Agent', ?, ?, 'simulation', ?, ?)`,
    [
      risk === 'CRITICAL' ? 'critical' : risk === 'HIGH' ? 'alert' : 'info',
      `Crisis Simulation Agent: ${scenario.name} → ${risk} capacity risk (${bedDemand} beds, ${icuDemand} ICU).`,
      String(simIns.insertId), userId,
    ]
  );

  return { simulation_id: simIns.insertId, scenario_key: scenarioKey, scenario_name: scenario.name, ...result };
}

export async function recentSimulations(limit = 10) {
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const sims = await query<any[]>(
    `SELECT s.simulation_id, s.scenario_name, s.scenario_key, s.parameters, s.created_at,
            r.bed_demand, r.icu_demand, r.doctor_workload_delta,
            r.medicine_demand_units, r.ambulances_required, r.capacity_risk
     FROM simulations s JOIN simulation_results r ON r.simulation_id = s.simulation_id
     ORDER BY s.created_at DESC LIMIT ${safeLimit}`
  );
  return sims;
}
