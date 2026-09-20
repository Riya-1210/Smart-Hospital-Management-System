import { useState } from 'react';
import { useHospital } from '../contexts/HospitalContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Plus, Clock, User, Stethoscope } from 'lucide-react';

export default function AppointmentsPage() {
  const { state, bookAppointment } = useHospital();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doctor: '', date: '', time: '10:00', type: 'Regular Checkup' });
  const [booked, setBooked] = useState(false);

  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  // Role-based appointment filtering
  let myAppts = state.appointments;
  if (isDoctor) {
    // Doctor sees only appointments booked with them
    myAppts = state.appointments.filter(a => a.doctorName === user?.name);
  } else if (isPatient) {
    // Patient sees only their own appointments
    myAppts = state.appointments.filter(a => a.patientId === user?.id);
  }
  // Admin and other roles see all appointments

  const handleBook = () => {
    if (!form.date || !form.doctor) return;
    const selectedDoctor = state.doctors.find(d => d.name === form.doctor);
    bookAppointment(
      user?.id || 'P-001',
      user?.name || 'Patient',
      selectedDoctor?.id || '',
      form.doctor,
      form.date,
      form.time,
      form.type
    );
    setBooked(true);
    setShowForm(false);
    setTimeout(() => setBooked(false), 3000);
  };

  const statusStyle: Record<string, { color: string; bg: string; border: string }> = {
    Completed: { color: '#34483A', bg: '#E8EDE6', border: '#C5CEBC' },
    Scheduled: { color: '#34483A', bg: '#EFF3ED', border: '#A8B39F' },
    Cancelled: { color: '#8C8A83', bg: '#F2EFE8', border: '#C8C3BB' },
    Missed: { color: '#C65A52', bg: '#FDEAEA', border: '#E8B4B4' },
  };

  const pageTitle = isDoctor ? 'My Schedule' : 'My Appointments';
  const pageSubtitle = isDoctor
    ? 'Appointments scheduled with you'
    : isPatient
      ? 'Schedule and manage your medical appointments'
      : 'Hospital-wide appointment overview';

  return (
    <div className="p-6 space-y-5 max-w-2xl" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calendar size={20} className="text-[#78856F]" />
            {pageTitle}
          </h1>
          <p className="page-subtitle">{pageSubtitle}</p>
        </div>
        {/* Only patients can book appointments */}
        {isPatient && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={14} /> Book Appointment
          </button>
        )}
      </div>

      {booked && (
        <div className="rounded-lg p-3 border" style={{ background: '#EFF3ED', borderColor: '#A8B39F' }}>
          <span className="text-sm text-[#34483A] font-medium">✓ Appointment booked successfully!</span>
        </div>
      )}

      {/* Booking form - only for patients */}
      {showForm && isPatient && (
        <div className="card space-y-4">
          <h3 className="section-title">Book New Appointment</h3>
          <div>
            <label className="label">Doctor</label>
            <select
              value={form.doctor}
              onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))}
              className="select"
            >
              <option value="">Select a doctor...</option>
              {state.doctors.filter(d => d.status !== 'Off Duty').map(d => (
                <option key={d.id} value={d.name}>{d.name} — {d.specialization}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Time</label>
              <select
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="select"
              >
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Appointment Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="select"
            >
              {['Regular Checkup', 'Follow-up', 'Emergency Review', 'Consultation', 'Lab Review'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={handleBook} disabled={!form.date || !form.doctor} className="btn btn-primary flex-1 disabled:opacity-50">
              Book Appointment
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Appointments list */}
      <div className="card">
        <div className="space-y-1">
          {myAppts.length === 0 ? (
            <div className="text-center text-[#8C8A83] py-6 text-sm">
              {isDoctor ? (
                <>
                  No appointments scheduled.<br />
                  <span className="text-xs">You currently have no upcoming patient appointments.</span>
                </>
              ) : isPatient ? (
                <>
                  No appointments yet.{' '}
                  <button onClick={() => setShowForm(true)} className="text-[#78856F] hover:text-[#34483A] font-medium">
                    Book one now →
                  </button>
                </>
              ) : (
                'No appointments in the system.'
              )}
            </div>
          ) : (
            myAppts.map(a => {
              const ss = statusStyle[a.status] ?? statusStyle['Cancelled'];
              return (
                <div key={a.id} className="flex items-center gap-3 py-3 border-b border-[#F2EFE8] last:border-0">
                  <Calendar size={16} className="text-[#78856F] shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isDoctor ? (
                        <>
                          <User size={12} className="text-[#78856F]" />
                          <span className="text-sm font-semibold text-[#292824]">{a.patientName}</span>
                          <span className="text-[10px] text-[#8C8A83]">({a.patientId})</span>
                        </>
                      ) : (
                        <>
                          <Stethoscope size={12} className="text-[#78856F]" />
                          <span className="text-sm font-semibold text-[#292824]">{a.doctorName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={10} className="text-[#8C8A83]" />
                      <span className="text-xs text-[#8C8A83]">{a.date} at {a.time} · {a.type}</span>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0"
                    style={{ color: ss.color, background: ss.bg, borderColor: ss.border }}
                  >
                    {a.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Doctor: summary stats */}
      {isDoctor && myAppts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: myAppts.length },
            { label: 'Scheduled', value: myAppts.filter(a => a.status === 'Scheduled').length },
            { label: 'Completed', value: myAppts.filter(a => a.status === 'Completed').length },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-xl font-bold text-[#292824]">{s.value}</div>
              <div className="text-xs text-[#8C8A83]">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#8C8A83] italic text-center">Demonstration data only.</p>
    </div>
  );
}
