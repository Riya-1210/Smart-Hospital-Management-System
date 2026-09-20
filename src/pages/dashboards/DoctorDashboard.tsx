import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useHospital } from '../../contexts/HospitalContext';
import RiskBadge from '../../components/RiskBadge';
import PriorityBadge from '../../components/PriorityBadge';
import type { DoctorPatient } from '../../contexts/HospitalContext';

/** Short display status for a doctor's patient, derived from DB link rows. */
function patientSummary(p: DoctorPatient): { status: string; detail: string } {
  const activeEmerg = p.links.find(l => l.type === 'EMERGENCY' && l.emergencyStatus && l.emergencyStatus !== 'DISCHARGED');
  if (activeEmerg?.bedNumber) {
    return { status: 'Admitted', detail: `${activeEmerg.bedNumber} — ${activeEmerg.wardName || 'Ward'}` };
  }
  if (activeEmerg) {
    return { status: 'Emergency', detail: activeEmerg.reason || 'Under emergency care' };
  }
  const upcoming = p.links
    .filter(l => l.type === 'APPOINTMENT' && (l.status === 'PENDING' || l.status === 'CONFIRMED'))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  if (upcoming.length) {
    return { status: upcoming[0].status === 'CONFIRMED' ? 'Confirmed' : 'Scheduled', detail: `${upcoming[0].reason || 'Consultation'} — ${upcoming[0].date || ''}` };
  }
  const completed = p.links.find(l => l.type === 'APPOINTMENT' && l.status === 'COMPLETED');
  if (completed) {
    return { status: 'Follow-up', detail: `Last visit ${completed.date || ''}` };
  }
  return { status: 'Under Care', detail: p.links[0]?.reason || 'Registered patient' };
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state, approveRec, rejectRec } = useHospital();

  // All data below comes from the database via the backend
  // (appointments, emergency_cases, beds, wards, patients tables).
  const myPatients = state.doctorPatients;
  const emergencyCases = state.emergencyCases.filter(e => e.status !== 'Discharged');
  const icuPatients = state.icuPatients;
  const pending = state.recommendations.filter(r => r.status === 'Pending').slice(0, 3);
  // "Today" in the app's local timezone (the MySQL server runs in the same
  // SYSTEM timezone, so appointment_date strings compare 1:1 with this).
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todaysAppts = state.appointments
    .filter(a => a.doctorName === user?.name && a.date === todayStr)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const myAppts = todaysAppts.slice(0, 5);
  const hour = now.getHours();

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, {user?.name}</h1>
          <p className="page-subtitle">Your patients, appointments, emergency and ICU overview</p>
        </div>
        <button onClick={() => navigate('/doctor/emergency')} className="btn-danger flex items-center gap-2">
          🚨 Emergency Cases
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'My Patients', value: myPatients.length, to: '/doctor/patients' },
          { label: 'Emergency Cases', value: emergencyCases.length, to: '/doctor/emergency' },
          { label: 'ICU Patients', value: icuPatients.length, to: '/doctor/dashboard#icu' },
          { label: "Today's Appointments", value: todaysAppts.length, to: '/doctor/appointments' },
        ].map(m => (
          <div key={m.label} onClick={() => navigate(m.to)} className="card cursor-pointer hover:border-primary-300 transition-all">
            <div className="text-2xl font-bold text-neutral-900">{m.value}</div>
            <div className="text-xs text-neutral-600 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* My Patients — real DB roster */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title !mb-0">My Patients <span className="text-xs font-normal text-neutral-500">({myPatients.length} under your care)</span></h3>
          <button onClick={() => navigate('/doctor/patients')} className="text-xs text-primary-600 hover:underline font-medium">View All →</button>
        </div>
        {myPatients.length === 0 ? (
          <div className="text-xs text-neutral-500 py-4 text-center">
            No patients are currently linked to your account in the hospital database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Patient ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Department</th><th>Status</th><th>Details</th>
              </tr></thead>
              <tbody>
                {myPatients.map(p => {
                  const s = patientSummary(p);
                  return (
                    <tr key={p.patientId} onClick={() => navigate('/doctor/patients')} className="cursor-pointer">
                      <td className="font-mono text-xs text-neutral-500">P-{String(p.patientId).padStart(3, '0')}</td>
                      <td className="font-medium text-neutral-900">{p.name}</td>
                      <td>{p.age ?? '—'}</td>
                      <td>{p.gender || '—'}</td>
                      <td>{p.department || '—'}</td>
                      <td><span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold badge-info">{s.status}</span></td>
                      <td className="text-xs text-neutral-600 max-w-[220px] truncate">{s.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Emergency Cases — view-only (database records) */}
      {emergencyCases.length > 0 && (
        <div className="alert-critical">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-critical-600 mb-2">Active Emergency Cases <span className="font-normal text-neutral-500">(view-only — from hospital database)</span></h3>
            <div className="space-y-2">
              {emergencyCases.slice(0, 4).map(e => (
                <div key={e.id} onClick={() => navigate('/doctor/emergency')} className="bg-white rounded-lg p-3 flex items-start gap-3 cursor-pointer hover:bg-neutral-100 transition-colors border border-neutral-200">
                  <PriorityBadge priority={e.priority} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-neutral-900">{e.name}</div>
                    <div className="text-xs text-neutral-600">{e.symptoms}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{e.department} · {e.status}{e.bed ? ` · Bed ${e.bed}` : ''}</div>
                  </div>
                  <span className="text-xs text-primary-600 font-medium">View →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ICU Patients — current ICU admissions from the database */}
      <div className="card" id="icu">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title !mb-0">ICU Patients <span className="text-xs font-normal text-neutral-500">(currently admitted)</span></h3>
          <button onClick={() => navigate('/nurse/beds')} className="text-xs text-primary-600 hover:underline font-medium">Bed Status →</button>
        </div>
        {icuPatients.length === 0 ? (
          <div className="text-xs text-neutral-500 py-4 text-center">No patients are currently admitted to ICU.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Patient ID</th><th>Name</th><th>Bed</th><th>Assigned Doctor</th><th>Admitted</th><th>Priority</th><th>Status</th>
              </tr></thead>
              <tbody>
                {icuPatients.map(ip => (
                  <tr key={ip.emergencyId}>
                    <td className="font-mono text-xs text-neutral-500">P-{String(ip.patientId).padStart(3, '0')}</td>
                    <td className="font-medium text-neutral-900">{ip.name}</td>
                    <td className="font-mono text-xs">{ip.bedNumber}</td>
                    <td>{ip.doctorName || '—'}</td>
                    <td className="text-xs text-neutral-600 font-mono">{ip.admittedAt}</td>
                    <td><PriorityBadge priority={ip.priority} /></td>
                    <td><span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold badge-info">{ip.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title !mb-0">AI Recommendations — Pending Approval</h3>
          <button onClick={() => navigate('/doctor/recommendations')} className="text-xs text-primary-600 hover:underline font-medium">View All →</button>
        </div>
        {pending.length === 0 ? (
          <div className="text-xs text-success-600 py-2 flex items-center gap-1">✓ No pending approvals — all caught up!</div>
        ) : (
          <div className="space-y-3">
            {pending.map(rec => (
              <div key={rec.id} className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <RiskBadge risk={rec.risk} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-neutral-900">{rec.action}</div>
                    <div className="text-xs text-neutral-600 mt-0.5">
                      {rec.factors.slice(0, 2).map((f, i) => <span key={i}>• {f} </span>)}
                    </div>
                    <div className="text-xs text-primary-600 mt-0.5">Confidence: {rec.confidence}%</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveRec(rec.id, user?.name || 'Doctor')} className="flex-1 btn-success text-xs py-1.5">✓ Approve</button>
                  <button onClick={() => rejectRec(rec.id, user?.name || 'Doctor')} className="flex-1 btn-secondary text-xs py-1.5">✕ Reject</button>
                  <button onClick={() => navigate('/doctor/recommendations')} className="flex-1 btn-secondary text-xs py-1.5">Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-neutral-500 mt-3 italic">AI recommendations are decision-support only. Final clinical decisions must be yours.</p>
      </div>

      {/* Schedule */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title !mb-0">Today's Schedule</h3>
          <button onClick={() => navigate('/doctor/appointments')} className="text-xs text-primary-600 hover:underline font-medium">View All →</button>
        </div>
        {myAppts.length === 0 ? (
          <div className="text-xs text-neutral-500 py-4 text-center">No appointments scheduled.</div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Time</th><th>Patient</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {myAppts.map(a => (
                <tr key={a.id}>
                  <td className="text-neutral-600 font-mono text-xs">{a.date} {a.time}</td>
                  <td className="font-medium text-neutral-900">{a.patientName}</td>
                  <td className="text-neutral-600">{a.type}</td>
                  <td>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${a.status === 'Completed' ? 'badge-low' : 'badge-info'}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
