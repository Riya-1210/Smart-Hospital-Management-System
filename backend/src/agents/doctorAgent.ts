import { query, execute } from '../config/database';

/**
 * DoctorSchedulingAgent — ranks doctors by specialization match + workload
 * computed from real appointments/emergency data, and persists the recommendation.
 */

export interface DoctorSuggestion {
  doctor_id: number;
  name: string;
  specialization: string;
  workload_score: number;
  active_appointments: number;
  emergency_cases: number;
  availability_status: string;
  match_score: number;
  confidence: number;
  reason: string;
}

export async function computeWorkloads(date?: string): Promise<Array<{
  doctor_id: number; name: string; specialization: string; department: string;
  active_appointments: number; emergency_cases: number; workload_score: number;
  availability_status: string; suggested_for_emergency: boolean;
}>> {
  const rows = await query<any[]>(
    `SELECT d.doctor_id, u.full_name AS name, d.specialization, dep.department_name AS department,
            d.availability_status,
            (SELECT COUNT(*) FROM appointments a
              WHERE a.doctor_id = d.doctor_id AND a.status IN ('PENDING','CONFIRMED')
                AND a.appointment_date >= COALESCE(?, CURDATE())) AS active_appointments,
            (SELECT COUNT(*) FROM emergency_cases e
              WHERE e.assigned_doctor_id = d.doctor_id AND e.status IN ('OPEN','IN_TREATMENT')) AS emergency_cases
     FROM doctors d
     JOIN users u ON u.user_id = d.user_id
     JOIN departments dep ON dep.department_id = d.department_id`,
    [date ?? null]
  );

  return rows.map((r) => {
    const score = Math.min(100, r.active_appointments * 6 + r.emergency_cases * 15);
    const status = score >= 85 ? 'OVERLOADED' : score >= 50 ? 'BUSY' : 'AVAILABLE';
    return { ...r, workload_score: score, availability_status: status, suggested_for_emergency: score < 85 };
  });
}

export async function persistWorkloads(list: Array<{ doctor_id: number; active_appointments: number; emergency_cases: number; workload_score: number; availability_status: string; suggested_for_emergency: boolean }>) {
  const today = new Date().toISOString().slice(0, 10);
  for (const d of list) {
    await execute(
      `INSERT INTO doctor_workload
         (doctor_id, workload_date, active_appointments, emergency_cases, total_patients, workload_score, availability_status, suggested_for_emergency)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         active_appointments = VALUES(active_appointments), emergency_cases = VALUES(emergency_cases),
         total_patients = VALUES(total_patients), workload_score = VALUES(workload_score),
         availability_status = VALUES(availability_status), suggested_for_emergency = VALUES(suggested_for_emergency),
         computed_at = CURRENT_TIMESTAMP`,
      [d.doctor_id, today, d.active_appointments, d.emergency_cases, d.active_appointments + d.emergency_cases,
       d.workload_score, d.availability_status, d.suggested_for_emergency ? 1 : 0]
    );
  }
}

export async function recommendDoctor(opts: {
  specialtyHint?: string;      // e.g. "Cardiology / Emergency"
  icuRequired: boolean;
  userId: number | null;
  emergencyId?: number | null;
}): Promise<{ suggestion: DoctorSuggestion | null; alternatives: DoctorSuggestion[] }> {
  const workloads = await computeWorkloads();
  const rows = await query<any[]>(
    `SELECT d.doctor_id, u.full_name AS name, d.specialization, d.experience_years, dep.department_name
     FROM doctors d JOIN users u ON u.user_id = d.user_id JOIN departments dep ON dep.department_id = d.department_id
     WHERE d.availability_status = 'AVAILABLE'`
  );

  const loadMap = new Map(workloads.map((w) => [w.doctor_id, w]));
  const hint = (opts.specialtyHint || '').toLowerCase();

  const scored = rows.map((d) => {
    const wl = loadMap.get(d.doctor_id);
    const workload = wl?.workload_score ?? 0;
    let score = 50;
    const factors: string[] = [];
    const spec = (d.specialization || '').toLowerCase();
    const dept = (d.department_name || '').toLowerCase();
    const specMatch = hint && (spec.includes(hint.split(' ')[0]) || hint.toLowerCase().includes(spec.split(' ')[0]));
    if (specMatch) { score += 40; factors.push(`specialization match: ${d.specialization}`); }
    if (workload < 40) { score += 15; factors.push(`low workload (${workload}%)`); }
    else if (workload < 70) { score += 8; factors.push(`moderate workload (${workload}%)`); }
    if (d.experience_years >= 10) { score += 5; factors.push(`${d.experience_years}y experience`); }
    if (wl?.suggested_for_emergency) { score += 10; factors.push('available for emergency assignment'); }
    if (!hint && factors.length === 0) factors.push('available generalist');
    return { d, workload, score, factors };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) return { suggestion: null, alternatives: [] };

  const suggestion: DoctorSuggestion = {
    doctor_id: best.d.doctor_id,
    name: best.d.name,
    specialization: best.d.specialization,
    workload_score: best.workload,
    active_appointments: loadMap.get(best.d.doctor_id)?.active_appointments ?? 0,
    emergency_cases: loadMap.get(best.d.doctor_id)?.emergency_cases ?? 0,
    availability_status: loadMap.get(best.d.doctor_id)?.availability_status ?? 'AVAILABLE',
    match_score: best.score,
    confidence: Math.min(97, Math.round(65 + best.score / 4)),
    reason: best.factors.join('; ') || 'Available and not overloaded',
  };
  const alternatives = scored.slice(1, 4).map((s) => ({
    doctor_id: s.d.doctor_id,
    name: s.d.name,
    specialization: s.d.specialization,
    workload_score: s.workload,
    active_appointments: loadMap.get(s.d.doctor_id)?.active_appointments ?? 0,
    emergency_cases: loadMap.get(s.d.doctor_id)?.emergency_cases ?? 0,
    availability_status: loadMap.get(s.d.doctor_id)?.availability_status ?? 'AVAILABLE',
    match_score: s.score,
    confidence: Math.min(97, Math.round(65 + s.score / 4)),
    reason: s.factors.join('; '),
  }));

  // Agent feed entry
  await execute(
    `INSERT INTO ai_agent_logs (agent_id, agent_name, event_type, message, reference_type, reference_id, confidence_score, created_by)
     VALUES ('doctor', 'Doctor Scheduling Agent', 'info', ?, 'emergency_case', ?, ?, ?)`,
    [
      `Doctor Scheduling Agent identified available ${best.d.specialization} — ${best.d.name} (workload ${best.workload}%).`,
      String(opts.emergencyId ?? ''), suggestion.confidence, opts.userId,
    ]
  );

  // Persist workload snapshots
  await persistWorkloads(workloads);

  return { suggestion, alternatives };
}
