import { useState } from 'react';
import { Users, Search } from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import type { DoctorPatient } from '../contexts/HospitalContext';
type DoctorPatientLink = DoctorPatient['links'][number];

/**
 * Doctor/Nurse/Admin patient roster — every row comes from the hospital
 * database (patients, appointments, emergency_cases, beds, wards) assembled
 * by GET /api/doctor/patients. No hardcoded patient data.
 */

/** Priority derived from real DB link rows (emergency priority, else lowest). */
function patientPriority(p: DoctorPatient): 'Critical' | 'High' | 'Moderate' | 'Mild' {
  const ranks = p.links
    .map((l: DoctorPatientLink) => (l.priority === 'CRITICAL' ? 'Critical' : l.priority === 'HIGH' ? 'High' : l.priority === 'MEDIUM' ? 'Moderate' : 'Mild'))
    .filter(Boolean) as Array<'Critical' | 'High' | 'Moderate' | 'Mild'>;
  if (ranks.includes('Critical')) return 'Critical';
  if (ranks.includes('High')) return 'High';
  if (ranks.includes('Moderate')) return 'Moderate';
  return 'Mild';
}

/** Latest activity line for a patient, from their DB link rows. */
function latestActivity(p: DoctorPatient): { status: string; detail: string; admittedAt: string } {
  const activeEmerg = p.links.find(l => l.type === 'EMERGENCY' && l.emergencyStatus && l.emergencyStatus !== 'DISCHARGED');
  if (activeEmerg?.bedNumber) {
    return { status: 'Admitted', detail: activeEmerg.reason || 'Under emergency care', admittedAt: activeEmerg.date || '—' };
  }
  if (activeEmerg) {
    return { status: 'Emergency', detail: activeEmerg.reason || 'Under emergency care', admittedAt: activeEmerg.date || '—' };
  }
  const upcoming = p.links
    .filter(l => l.type === 'APPOINTMENT' && (l.status === 'PENDING' || l.status === 'CONFIRMED'))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (upcoming.length) {
    return { status: upcoming[0].status === 'CONFIRMED' ? 'Active' : 'Scheduled', detail: upcoming[0].reason || 'Consultation', admittedAt: upcoming[0].date || '—' };
  }
  const completed = p.links.find(l => l.type === 'APPOINTMENT' && l.status === 'COMPLETED');
  if (completed) {
    return { status: 'Discharged', detail: `Last visit: ${completed.reason || 'consultation'}`, admittedAt: completed.date || '—' };
  }
  return { status: 'Active', detail: 'Registered patient', admittedAt: '—' };
}

export default function PatientsPage() {
  const { user } = useAuth();
  const { state } = useHospital();
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const isDoctor = user?.role === 'doctor';

  // Live roster straight from the database via the backend API
  const roster = state.doctorPatients;
  const dataSource = state.dataSource;

  const withMeta = roster.map(p => ({ ...p, priority: patientPriority(p), activity: latestActivity(p) }));

  const filtered = withMeta.filter(p => {
    const idLabel = `P-${String(p.patientId).padStart(3, '0')}`;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || idLabel.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === 'All' || p.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const selected = withMeta.find(p => p.patientId === selectedId) || null;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-warm-900 flex items-center gap-2">
            <Users size={20} className="text-sage-700" />
            {isDoctor ? 'My Patients' : 'Patient Management'}
          </h1>
          <p className="text-xs text-warm-500 mt-0.5">
            {dataSource === 'backend'
              ? 'Live patient roster from the hospital database'
              : 'Backend unreachable — showing offline state'}
          </p>
        </div>
        <span className="demo-tag">{dataSource === 'backend' ? 'Database Connected' : 'Offline'}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Patients", value: withMeta.length, color: "text-warm-900" },
          { label: "Critical", value: withMeta.filter(p => p.priority === 'Critical').length, color: "text-terra-500" },
          { label: "High Priority", value: withMeta.filter(p => p.priority === 'High').length, color: "text-amber-600" },
          { label: "Admitted", value: withMeta.filter(p => p.activity.status === 'Admitted').length, color: "text-sage-600" },
        ].map(m => (
          <div key={m.label} className="card text-center">
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-xs text-warm-500">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full bg-white border border-warm-300 rounded-lg pl-8 pr-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-sage-600"
          />
        </div>
        <div className="flex gap-1">
          {['All', 'Critical', 'High', 'Moderate', 'Mild'].map(p => (
            <button key={p} onClick={() => setFilterPriority(p)} className={`text-xs px-3 py-2 rounded-lg border transition-colors ${filterPriority === p ? 'border-sage-600 bg-sage-700/20 text-warm-900' : 'border-warm-300 text-warm-500 hover:text-warm-900'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Patient List */}
        <div className="card">
          <div className="space-y-2">
            {dataSource !== 'backend' ? (
              <div className="text-xs text-warm-500 py-6 text-center">
                Cannot reach the hospital backend. Please make sure the backend server is running, then reload.
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-xs text-warm-500 py-6 text-center">
                {withMeta.length === 0
                  ? 'No patients are currently linked to your account in the hospital database.'
                  : 'No patients match the current search/filter.'}
              </div>
            ) : filtered.map(p => {
              const idLabel = `P-${String(p.patientId).padStart(3, '0')}`;
              return (
                <div
                  key={p.patientId}
                  onClick={() => setSelectedId(p.patientId)}
                  className={`border rounded-xl p-3 cursor-pointer transition-colors ${selectedId === p.patientId ? 'border-sage-600 bg-sage-700/10' : 'border-warm-300 hover:border-warm-200 hover:bg-warm-50/50'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityBadge priority={p.priority} />
                        <span className="text-sm font-semibold text-warm-900">{p.name}</span>
                        <span className="text-xs text-warm-400">{idLabel}</span>
                      </div>
                      <div className="text-xs text-warm-500 mt-0.5">{p.activity.detail}</div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-warm-400">
                        {p.age != null && <span>{p.age}y {p.gender || ''}</span>}
                        <span>{p.department || '—'}</span>
                        <span>{p.doctorName || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] space-y-0.5">
                      <div className={p.activity.status === 'Discharged' ? 'text-warm-400' : 'text-sage-600 font-semibold'}>{p.activity.status}</div>
                      <div className="text-warm-400">{(p.activity.admittedAt || '').slice(0, 10)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient Profile */}
        {selected ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-warm-900">Patient Profile — P-{String(selected.patientId).padStart(3, '0')}</h3>
              <PriorityBadge priority={selected.priority} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-xs text-warm-500">Name</div>
                <div className="text-sm font-semibold text-warm-900">{selected.name}</div>
              </div>
              <div>
                <div className="text-xs text-warm-500">Age / Gender</div>
                <div className="text-sm text-warm-900">{selected.age != null ? `${selected.age}y` : '—'} {selected.gender || ''}</div>
              </div>
              <div>
                <div className="text-xs text-warm-500">Department</div>
                <div className="text-sm text-warm-900">{selected.department || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-warm-500">Doctor</div>
                <div className="text-sm text-warm-900">{selected.doctorName || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-warm-500">Phone</div>
                <div className="text-sm text-warm-900">{selected.phone || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-warm-500">Blood Group</div>
                <div className="text-sm text-warm-900">{selected.bloodGroup || '—'}</div>
              </div>
            </div>

            <div className="bg-warm-50 rounded-xl p-3 mb-3">
              <div className="text-xs text-warm-500 mb-1">Latest Activity</div>
              <div className="text-sm text-warm-900">{selected.activity.detail}</div>
              <div className="text-xs text-warm-500 mt-1">Status: <span className="text-sage-700">{selected.activity.status}</span></div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-warm-500 mb-2 font-semibold">CARE HISTORY (FROM DATABASE)</div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selected.links.map((l, i) => (
                  <div key={i} className="bg-warm-100 rounded-lg px-2.5 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-warm-500">{l.type === 'APPOINTMENT' ? 'APPOINTMENT' : 'EMERGENCY CASE'}</span>
                      <span className="text-[10px] text-warm-400">{(l.date || '').slice(0, 10)}</span>
                    </div>
                    <div className="text-xs text-warm-900 mt-0.5">{l.reason || '—'}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-warm-500">{l.status || ''}</span>
                      {l.bedNumber && <span className="text-[10px] text-sage-700 font-semibold">{l.bedNumber} · {l.wardName || l.wardType || ''}</span>}
                      {l.priority && <span className="text-[10px] text-amber-600 font-semibold">{l.priority}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-warm-50 rounded-xl p-3">
              <div className="text-xs text-warm-500 mb-1 font-semibold">AI ALERTS</div>
              {selected.priority === 'Critical' && (
                <div className="text-xs text-terra-500 flex items-center gap-1">
                  <span className="status-dot bg-terra-400 animate-pulse" />
                  Critical patient — Continuous monitoring required
                </div>
              )}
              {selected.links.some(l => l.type === 'EMERGENCY' && l.emergencyStatus && l.emergencyStatus !== 'DISCHARGED') && selected.priority !== 'Critical' && (
                <div className="text-xs text-amber-600 mt-1">⚠️ Active emergency case — monitor closely</div>
              )}
              {selected.priority !== 'Critical' && !selected.links.some(l => l.type === 'EMERGENCY') && (
                <div className="text-xs text-sage-600 mt-1">✓ No active alerts for this patient</div>
              )}
              <div className="text-[10px] text-warm-400 mt-2 italic">AI alerts are decision-support only</div>
            </div>
          </div>
        ) : (
          <div className="card flex items-center justify-center text-warm-400 text-sm">
            <div className="text-center">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              Select a patient to view profile
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
