import { useNavigate } from 'react-router-dom';
import { useHospital } from '../../contexts/HospitalContext';
import { useAuth } from '../../contexts/AuthContext';
import PriorityBadge from '../../components/PriorityBadge';

export default function NurseDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useHospital();

  // All values below derive from live database records (patients, emergency
  // cases, beds) — no hardcoded counts or synthetic vitals.
  const underCare = state.doctorPatients.length || state.patients.length;
  const criticalPatients = state.emergencyCases.filter(e =>
    ['Critical', 'High'].includes(e.priority) && e.status !== 'Discharged');
  const availBeds = state.beds.filter(b => b.status === 'Available').length;
  const vitalAlerts = state.emergencyCases.filter(e => e.status !== 'Discharged' && e.priority === 'Critical').length;

  return (
    <div className="p-5 space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Hello, {user?.name}</h1>
        <p className="page-subtitle">Patient care overview for your shift</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Patients Under Care", value: underCare, to: '/nurse/patients' },
          { label: "Critical Patients", value: criticalPatients.length, to: '/nurse/patients' },
          { label: "Available Beds", value: availBeds, to: '/nurse/beds' },
          { label: "Vital Alerts", value: vitalAlerts, to: '/nurse/patients' },
        ].map(m => (
          <div key={m.label} onClick={() => navigate(m.to)} className="card cursor-pointer hover:border-primary-300 transition-all">
            <div className="text-2xl font-bold text-neutral-900">{m.value}</div>
            <div className="text-xs text-neutral-600 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="section-title">Patients Needing Attention</h3>
        <div className="space-y-1">
          {criticalPatients.length === 0 ? (
            <div className="text-xs text-neutral-500 py-4 text-center">No patients currently need urgent attention.</div>
          ) : criticalPatients.map(p => (
            <div key={p.id} onClick={() => navigate('/nurse/patients')} className="flex items-center gap-3 py-2.5 border-b border-neutral-200 last:border-0 cursor-pointer hover:bg-primary-50/50 rounded px-1 transition-colors">
              <PriorityBadge priority={p.priority} />
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-900">{p.name}</div>
                <div className="text-xs text-neutral-600">{p.bed ? `Bed ${p.bed} · ` : ''}{p.doctor || 'Unassigned'}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-600">{p.status}</div>
                <div className="text-xs text-neutral-500">{p.department}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/nurse/patients')} className="card text-left hover:border-primary-300 transition-all">
          <div className="text-lg mb-1">👥</div>
          <div className="text-sm font-semibold text-neutral-900">View All Patients</div>
        </button>
        <button onClick={() => navigate('/nurse/beds')} className="card text-left hover:border-primary-300 transition-all">
          <div className="text-lg mb-1">🛏️</div>
          <div className="text-sm font-semibold text-neutral-900">Bed Status</div>
        </button>
        <button onClick={() => navigate('/nurse/alerts')} className="bg-critical-50 border border-critical-200 rounded-xl p-4 text-left hover:bg-critical-100 transition-all">
          <div className="text-lg mb-1">🚨</div>
          <div className="text-sm font-semibold text-critical-700">Emergency Alert</div>
        </button>
        <button onClick={() => navigate('/nurse/tasks')} className="card text-left hover:border-primary-300 transition-all">
          <div className="text-lg mb-1">📋</div>
          <div className="text-sm font-semibold text-neutral-900">Follow-up Tasks</div>
        </button>
      </div>
    </div>
  );
}
