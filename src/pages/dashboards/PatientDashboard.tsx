import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useHospital } from '../../contexts/HospitalContext';
import { api } from '../../lib/api';

interface MedRecord {
  record_id: number;
  record_date: string;
  diagnosis: string | null;
  doctor_name: string | null;
  treatment_given: string | null;
}

interface DoctorRow {
  doctor_id: number;
  full_name: string;
  specialization: string | null;
  department_name: string | null;
}

interface Prescription {
  prescription_id: number;
  items: unknown[];
}

/** All patient-facing data below comes from the hospital database via the
 *  backend API (appointments, medical records, prescriptions, doctors). */
export default function PatientDashboard() {
  const { user } = useAuth();
  const { state, bookAppointment } = useHospital();
  const navigate = useNavigate();

  const myAppts = state.appointments.filter(a => a.patientId === user?.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const upcomingAppt = myAppts.find(a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.date >= todayStr);

  const [records, setRecords] = useState<MedRecord[] | null>(null);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [prescCount, setPrescCount] = useState<number | null>(null);
  const [bookMsg, setBookMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ records: MedRecord[] }>('/api/medical-records').then(r => setRecords(r.records)).catch(() => setRecords([]));
    api.get<{ doctors: DoctorRow[] }>('/api/doctors').then(r => setDoctors(r.doctors)).catch(() => setDoctors([]));
    api.get<{ prescriptions: Prescription[] }>('/api/prescriptions').then(r => setPrescCount(r.prescriptions.length)).catch(() => setPrescCount(0));
  }, []);

  const latest = records && records.length ? records[0] : null;
  const cardiologyDoctors = doctors.filter(d => d.full_name && d.full_name.startsWith('Dr'));
  const bookTarget = cardiologyDoctors[0] || null;

  const handleBook = async () => {
    if (!bookTarget) { setBookMsg('No doctors available in the database.'); return; }
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    try {
      await bookAppointment(user?.id || '', user?.name || '', `D-${bookTarget.doctor_id}`, bookTarget.full_name, date, '11:00', 'Regular Checkup');
      setBookMsg(`Appointment requested with ${bookTarget.full_name} for ${date}.`);
    } catch {
      setBookMsg('Could not book right now — please try again.');
    }
  };

  return (
    <div className="p-5 space-y-5 max-w-2xl">
      {/* Greeting card — status from medical_records */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
        <h1 className="text-lg font-bold text-neutral-900 mb-1">Hello, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-neutral-600 mb-3">Welcome to your health portal.</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div><span className="text-neutral-600">Care team:</span> <span className="font-medium text-neutral-900">{latest?.doctor_name ? (latest.doctor_name.startsWith('Dr') ? latest.doctor_name : `Dr. ${latest.doctor_name}`) : '—'}</span></div>
          <div><span className="text-neutral-600">Last diagnosis:</span> <span className="font-medium text-neutral-900">{latest?.diagnosis || '—'}</span></div>
          <div><span className="text-neutral-600">Last visit:</span> <span className="font-medium text-neutral-900">{latest ? (latest.record_date || '').slice(0, 10) : '—'}</span></div>
          <div><span className="text-neutral-600">Treatments on file:</span> <span className="font-medium text-neutral-900">{records ? records.length : '…'}</span></div>
        </div>
        {bookMsg && <div className="text-xs text-success-600 mt-2">{bookMsg}</div>}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleBook} className="btn-primary py-3 flex items-center justify-center gap-2">📅 Book Appointment</button>
        <button onClick={() => navigate('/patient/recovery')} className="btn-secondary py-3 flex items-center justify-center gap-2">❤️ View Recovery</button>
        <button onClick={() => navigate('/patient/appointments')} className="btn-secondary py-3 flex items-center justify-center gap-2">📋 Appointments</button>
        <button onClick={() => navigate('/patient/prescriptions')} className="btn-secondary py-3 flex items-center justify-center gap-2">💊 Prescriptions</button>
      </div>

      {/* Next appointment — from the appointments table */}
      <div className="card">
        <h3 className="section-title">Upcoming Appointment</h3>
        {upcomingAppt ? (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <div className="text-sm font-semibold text-neutral-900">{upcomingAppt.doctorName}</div>
            <div className="text-xs text-neutral-600 mt-0.5">{upcomingAppt.date} at {upcomingAppt.time}</div>
            <div className="text-xs text-primary-600 mt-0.5">{upcomingAppt.type}</div>
            <span className="inline-block mt-2 badge-low">✓ {upcomingAppt.status}</span>
          </div>
        ) : (
          <div className="text-xs text-neutral-600">
            <p className="mb-2">No upcoming appointments.</p>
            <button onClick={handleBook} className="text-primary-600 font-semibold hover:underline">
              + Book a consultation →
            </button>
          </div>
        )}
      </div>

      {/* Recovery trend — derived from medical records count (no synthetic vitals) */}
      <div className="card">
        <h3 className="section-title">Your Care Summary</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg py-3">
            <div className="text-xl font-bold text-neutral-900">{myAppts.length}</div>
            <div className="text-[10px] text-neutral-600">Appointments</div>
          </div>
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg py-3">
            <div className="text-xl font-bold text-neutral-900">{records ? records.length : '…'}</div>
            <div className="text-[10px] text-neutral-600">Medical records</div>
          </div>
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg py-3">
            <div className="text-xl font-bold text-neutral-900">{prescCount ?? '…'}</div>
            <div className="text-[10px] text-neutral-600">Prescriptions</div>
          </div>
        </div>
      </div>

      {/* Prescriptions preview — count from database */}
      <div className="card">
        <h3 className="section-title">Current Prescriptions</h3>
        {prescCount === null ? (
          <div className="text-xs text-neutral-500 py-3">Loading…</div>
        ) : prescCount === 0 ? (
          <div className="text-xs text-neutral-600 py-2">No prescriptions on file yet. They will appear once your doctor issues them.</div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-800">You have {prescCount} prescription{prescCount === 1 ? '' : 's'} on file.</span>
            <button onClick={() => navigate('/patient/prescriptions')} className="text-xs text-primary-600 hover:underline font-medium">View them →</button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-neutral-500 text-center italic">
        Data from the hospital database. For medical decisions, always consult your doctor.
      </p>
    </div>
  );
}
