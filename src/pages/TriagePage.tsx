import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useHospital } from '../contexts/HospitalContext';
import PriorityBadge from '../components/PriorityBadge';

const groupColors = {
  Critical: { bg: '#FBF0EC', border: '#D4957E', label: '#8F5540' },
  High: { bg: '#FBF4EF', border: '#D9B97A', label: '#9A7535' },
  Moderate: { bg: '#F5F0E8', border: '#D9B97A', label: '#9A7535' },
  Mild: { bg: '#EFF3ED', border: '#A8B39F', label: '#34483A' },
};

export default function TriagePage() {
  const { state } = useHospital();
  const navigate = useNavigate();

  const cases = state.emergencyCases;
  const critical = cases.filter(e => e.priority === 'Critical');
  const high = cases.filter(e => e.priority === 'High');
  const moderate = cases.filter(e => e.priority === 'Moderate');
  const mild = cases.filter(e => e.priority === 'Mild');

  const groups = [
    { label: 'Critical', count: critical.length, patients: critical },
    { label: 'High', count: high.length, patients: high },
    { label: 'Moderate', count: moderate.length, patients: moderate },
    { label: 'Mild', count: mild.length, patients: mild },
  ] as const;

  return (
    <div className="p-6 space-y-6" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <AlertTriangle size={20} className="text-[#B86F52]" />
            Triage Board
          </h1>
          <p className="page-subtitle">Current patient triage status by priority</p>
        </div>
        <button onClick={() => navigate('/emergency/cases')} className="btn btn-primary">
          + New Emergency
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="card text-center py-14">
          <AlertTriangle size={32} className="mx-auto mb-3 text-[#C8C3BB]" />
          <div className="text-sm text-[#8C8A83]">No active emergency cases</div>
          <div className="text-xs text-[#8C8A83] mt-1">Start a demo emergency to see triage in action</div>
          <button onClick={() => navigate('/emergency/cases')} className="btn btn-primary mt-5">
            Go to Emergency Cases
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => {
            const colors = groupColors[group.label];
            return (
              <div
                key={group.label}
                className="rounded-xl p-4 border"
                style={{ background: colors.bg, borderColor: colors.border }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold" style={{ color: colors.label }}>
                    {group.label} Priority
                  </h3>
                  <span className="text-xl font-bold" style={{ color: colors.label }}>
                    {group.count}
                  </span>
                </div>
                {group.patients.length === 0 ? (
                  <div className="text-xs text-[#8C8A83] text-center py-3">
                    No {group.label.toLowerCase()} patients
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.patients.map(p => (
                      <div key={p.id} className="bg-white border border-[#E2DDD5] rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#292824]">{p.name}</span>
                          <PriorityBadge priority={p.priority} />
                        </div>
                        <div className="text-xs text-[#5C5A54] mt-0.5">{p.symptoms}</div>
                        <div className="text-xs text-[#8C8A83] mt-1">
                          HR: {p.vitals.hr} · SpO2: {p.vitals.spo2}% · BP: {p.vitals.bp}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
