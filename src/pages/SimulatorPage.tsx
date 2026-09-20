import { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle, Play } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { simulationScenarios } from '../data/demoData';
import { useHospital } from '../contexts/HospitalContext';
import { hospitalApi, type SimulationResult } from '../lib/api';

const BASE_STATE = { icu: 82, beds: 72, medicines: 70, doctors: 78, ambulances: 50 };

function getSimulatedState(scenario: typeof simulationScenarios[0]) {
  return {
    icu: Math.min(100, BASE_STATE.icu + (scenario.impact.icu * 3)),
    beds: Math.min(100, BASE_STATE.beds + scenario.impact.beds * 2),
    medicines: Math.max(0, BASE_STATE.medicines + scenario.impact.medicines),
    doctors: Math.max(0, BASE_STATE.doctors + (scenario.impact.doctors * -5)),
    ambulances: BASE_STATE.ambulances,
  };
}

function getOptimizedState(crisis: ReturnType<typeof getSimulatedState>) {
  return {
    icu: Math.max(BASE_STATE.icu, crisis.icu - 10),
    beds: Math.max(BASE_STATE.beds, crisis.beds - 8),
    medicines: Math.min(100, crisis.medicines + 15),
    doctors: Math.min(100, crisis.doctors + 15),
    ambulances: Math.min(100, crisis.ambulances + 20),
  };
}

export default function SimulatorPage() {
  const { addNotification } = useHospital();
  const [selected, setSelected] = useState<typeof simulationScenarios[0] | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof getSimulatedState> | null>(null);
  const [liveSim, setLiveSim] = useState<SimulationResult | null>(null);

  const handleRun = async () => {
    if (!selected) return;
    setRunning(true);
    try {
      // Run against the backend Crisis Simulation Agent (persists to simulations table)
      const keyMap: Record<string, string> = {
        'S-001': 'ROAD_ACCIDENT', 'S-002': 'ICU_CAPACITY_LOSS',
        'S-003': 'DOCTOR_SHORTAGE', 'S-004': 'MEDICINE_STOCKOUT', 'S-005': 'AMBULANCE_SHORTAGE',
      };
      const res = await hospitalApi.simulation(keyMap[selected.id] || 'CUSTOM_SURGE', { patients: 20, windowMinutes: 30 });
      setLiveSim(res.simulation);
      // Blend the backend result into the existing visual model
      const sim = res.simulation;
      setResults({
        ...getSimulatedState(selected),
        icu: Math.min(100, BASE_STATE.icu + Math.round((sim.icu_demand / Math.max(1, sim.icu_demand + 2)) * 30)),
        beds: Math.min(100, BASE_STATE.beds + Math.round((sim.bed_demand / Math.max(1, sim.bed_demand + 2)) * 30)),
        medicines: Math.max(0, BASE_STATE.medicines - Math.round((sim.medicine_demand_units / Math.max(1, sim.medicine_demand_units + 20)) * 60)),
        doctors: Math.max(0, BASE_STATE.doctors + Math.round(sim.doctor_workload_delta / 3)),
        ambulances: Math.max(0, BASE_STATE.ambulances + sim.ambulances_required),
      });
      addNotification('info', `Simulation completed: ${sim.scenario_name} — capacity risk ${sim.capacity_risk}`);
    } catch {
      // Backend offline → purely local simulation
      setResults(getSimulatedState(selected));
      addNotification('warning', `Simulation completed offline: ${selected.name}`);
    } finally {
      setRunning(false);
    }
  };

  const crisisState = results;
  const optimizedState = results ? getOptimizedState(results) : null;

  const chartData = crisisState ? [
    { metric: "ICU Load", current: BASE_STATE.icu, crisis: crisisState.icu, optimized: optimizedState!.icu },
    { metric: "Bed Load", current: BASE_STATE.beds, crisis: crisisState.beds, optimized: optimizedState!.beds },
    { metric: "Med Stock", current: BASE_STATE.medicines, crisis: crisisState.medicines, optimized: optimizedState!.medicines },
    { metric: "Doctor WL", current: BASE_STATE.doctors, crisis: crisisState.doctors, optimized: optimizedState!.doctors },
  ] : [];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Zap size={20} className="text-warning-500" />
            Crisis Simulator — What If?
          </h1>
          <p className="page-subtitle">Simulate hospital crisis scenarios and view AI-optimized response plans</p>
        </div>
        <span className="demo-tag">Simulation Only — Demo Data</span>
      </div>

      <div className="alert-warning">
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-sm text-neutral-700">
          <strong>What-If Simulator:</strong> Select a crisis scenario to see how the hospital state changes and how AI agents would coordinate the response. All simulation data only.
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="card">
        <h3 className="section-title">Select Crisis Scenario</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {simulationScenarios.map(s => (
            <button
              key={s.id}
              onClick={() => { setSelected(s); setResults(null); }}
              className={`text-left p-3 rounded-lg border transition-all ${
                selected?.id === s.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-300 bg-white hover:border-primary-300 hover:bg-primary-50/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-semibold text-neutral-900">{s.name}</span>
              </div>
              <p className="text-xs text-neutral-600">{s.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleRun}
          disabled={!selected || running}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Running Simulation...
            </>
          ) : (
            <>
              <Play size={14} />
              Run Simulation
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {crisisState && (
        <>
          {/* Comparison Chart */}
          <div className="card">
            <h3 className="section-title">Current State vs Crisis State vs AI-Optimized</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD5" />
                <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#8C8A83' }} />
                <YAxis domain={[0, 120]} tick={{ fontSize: 12, fill: '#8C8A83' }} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E2DDD5',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#292824',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#5C5A54' }} />
                <Bar dataKey="current" name="Current" fill="#78856F" radius={[3, 3, 0, 0]} />
                <Bar dataKey="crisis" name="Crisis State" fill="#B86F52" radius={[3, 3, 0, 0]} />
                <Bar dataKey="optimized" name="AI-Optimized" fill="#34483A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-[#8C8A83] mt-2">
              Higher = more loaded/stressed (except Meds where lower = more critical)
            </p>
          </div>

          {/* State Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Current */}
            <div className="card" style={{ borderColor: '#A8B39F' }}>
              <div className="text-xs font-bold text-[#34483A] mb-3 flex items-center gap-1.5">
                <span className="status-dot status-available" />
                CURRENT STATE
              </div>
              {Object.entries(BASE_STATE).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1.5 border-b border-[#F2EFE8] last:border-0">
                  <span className="text-[#5C5A54] capitalize">{k}</span>
                  <span className="text-[#292824] font-medium">{v}%</span>
                </div>
              ))}
            </div>

            {/* Crisis */}
            <div className="card" style={{ borderColor: '#D4957E' }}>
              <div className="text-xs font-bold text-[#B86F52] mb-3 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                CRISIS STATE
              </div>
              {Object.entries(crisisState).map(([k, v]) => {
                const base = BASE_STATE[k as keyof typeof BASE_STATE];
                const diff = v - base;
                return (
                  <div key={k} className="flex justify-between text-sm py-1.5 border-b border-[#F2EFE8] last:border-0">
                    <span className="text-[#5C5A54] capitalize">{k}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`font-medium ${v > 90 ? 'text-[#B86F52]' : v > 75 ? 'text-[#C39A52]' : 'text-[#292824]'}`}>
                        {v}%
                      </span>
                      {diff !== 0 && (
                        <span className={`text-xs ${diff > 0 ? 'text-[#B86F52]' : 'text-[#78856F]'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Optimized */}
            <div className="card" style={{ borderColor: '#A8B39F' }}>
              <div className="text-xs font-bold text-[#34483A] mb-3 flex items-center gap-1.5">
                <CheckCircle size={12} />
                AI-OPTIMIZED
              </div>
              {Object.entries(optimizedState!).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1.5 border-b border-[#F2EFE8] last:border-0">
                  <span className="text-[#5C5A54] capitalize">{k}</span>
                  <span className="text-[#34483A] font-medium">{v}%</span>
                </div>
              ))}
              <div className="mt-3 text-xs text-[#8C8A83] italic">
                After AI coordination + human-approved actions
              </div>
            </div>
          </div>

          {/* AI Action Plan */}
          <div className="card" style={{ borderColor: '#A8B39F' }}>
            <h3 className="section-title">AI Orchestrator Action Plan</h3>
            {liveSim && (
              <div className="mb-4 rounded-lg p-3 border border-[#E2DDD5]" style={{ background: '#FDFCFA' }}>
                <div className="text-xs font-semibold text-[#292824] mb-1">
                  Backend simulation #{liveSim.simulation_id} — {liveSim.scenario_name} · Capacity risk: <RiskBadge risk={liveSim.capacity_risk as any} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[#5C5A54]">
                  <span>Bed demand: <b>{liveSim.bed_demand}</b></span>
                  <span>ICU demand: <b>{liveSim.icu_demand}</b></span>
                  <span>Med units: <b>{liveSim.medicine_demand_units}</b></span>
                  <span>Ambulances: <b>{liveSim.ambulances_required}</b></span>
                  <span>Doctor WL delta: <b>+{liveSim.doctor_workload_delta}%</b></span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { agent: "Triage Agent", action: "Activate mass casualty triage protocol (START method)", approval: "High" },
                { agent: "Bed Agent", action: "Reserve all available ICU beds, initiate HDU overflow", approval: "Critical" },
                { agent: "Doctor Agent", action: "Call all on-call specialists, redistribute workload", approval: "High" },
                { agent: "Medicine Agent", action: "Emergency pharmacy procurement for critical medicines", approval: "High" },
                { agent: "Network Agent", action: "Contact H-002, H-004 for ICU overflow support", approval: "Critical" },
              ].map(a => (
                <div key={a.agent} className="rounded-lg p-3 border border-[#E2DDD5] flex items-start gap-3"
                  style={{ background: '#FDFCFA' }}>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#292824]">{a.agent}</div>
                    <div className="text-sm text-[#5C5A54] mt-0.5">{a.action}</div>
                  </div>
                  <RiskBadge risk={a.approval as any} />
                </div>
              ))}
            </div>
            <p className="text-xs text-[#8C8A83] mt-4 italic">
              All action plan items require authorized human approval before execution. AI provides recommendations only.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
