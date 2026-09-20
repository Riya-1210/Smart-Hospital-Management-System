const BASE = 'http://localhost:4000';
async function login(email) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo123' }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`login ${email} failed: ${JSON.stringify(body)}`);
  return body;
}
async function get(token, path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
(async () => {
  // 1. Login all four roles
  const admin = await login('admin@hospital.com');
  const doctor = await login('amit@hospital.com');
  const nurse = await login('nurse@hospital.com');
  const patient = await login('rahul@gmail.com');
  console.log('LOGIN OK — roles:', admin.user.role, doctor.user.role, nurse.user.role, patient.user.role);

  // 2. Obsolete roles must NOT log in
  for (const email of ['pharmacist@hospital.com', 'receptionist@hospital.com', 'lab@hospital.com']) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'demo123' }),
    });
    console.log(`obsolete login ${email} → HTTP ${res.status} (expect 401)`);
  }

  // 3. Doctor dashboard data
  const docPatients = await get(doctor.token, '/api/doctor/patients');
  const unique = [...new Set(docPatients.body.patients.map(p => p.patient_id))];
  console.log(`GET /api/doctor/patients → HTTP ${docPatients.status}, unique patients: ${unique.length} (expect >= 10)`);

  const icu = await get(doctor.token, '/api/icu-patients');
  console.log(`GET /api/icu-patients → HTTP ${icu.status}, ICU patients: ${icu.body.icu_patients.length}`);
  icu.body.icu_patients.forEach(p => console.log(`   ICU: P-${p.patient_id} ${p.patient_name} bed=${p.bed_number} doctor=${p.doctor_name} status=${p.status}`));

  const em = await get(doctor.token, '/api/emergency');
  console.log(`GET /api/emergency → HTTP ${em.status}, emergency cases: ${em.body.emergency_cases.length}`);
  em.body.emergency_cases.slice(0, 4).forEach(p => console.log(`   EMG: #${p.emergency_id} ${p.patient_name} ${p.priority} ${p.status}`));

  const appts = await get(doctor.token, '/api/appointments');
  console.log(`GET /api/appointments (doctor) → HTTP ${appts.status}, rows: ${appts.body.appointments.length}`);

  // 4. Admin-only routes
  const users = await get(admin.token, '/api/users');
  console.log(`GET /api/users (admin) → HTTP ${users.status}, users: ${users.body.users.length}`);
  const roles = await get(admin.token, '/api/roles');
  console.log(`GET /api/roles (admin) → HTTP ${roles.status}, roles: ${roles.body.roles.map(r => r.role_name).join(',')}`);

  // 5. Role guards — doctor must NOT access admin-only; patient must NOT access staff
  const doctorAsAdmin = await get(doctor.token, '/api/users');
  console.log(`GET /api/users as DOCTOR → HTTP ${doctorAsAdmin.status} (expect 403)`);
  const patientIcu = await get(patient.token, '/api/icu-patients');
  console.log(`GET /api/icu-patients as PATIENT → HTTP ${patientIcu.status} (expect 403)`);
  const patientDocPats = await get(patient.token, '/api/doctor/patients');
  console.log(`GET /api/doctor/patients as PATIENT → HTTP ${patientDocPats.status} (expect 403)`);

  // 6. Patient self-scope
  const myAppts = await get(patient.token, '/api/appointments');
  console.log(`GET /api/appointments (patient) → HTTP ${myAppts.status}, rows: ${myAppts.body.appointments.length} (own only)`);
  const myBills = await get(patient.token, '/api/bills');
  console.log(`GET /api/bills (patient) → HTTP ${myBills.status}`);

  // 7. Nurse access
  const nurseIcu = await get(nurse.token, '/api/icu-patients');
  console.log(`GET /api/icu-patients (nurse) → HTTP ${nurseIcu.status}, ICU patients: ${nurseIcu.body.icu_patients.length}`);

  // 8. Chatbot-related/general endpoints still alive
  const beds = await get(admin.token, '/api/beds');
  console.log(`GET /api/beds → HTTP ${beds.status}, beds: ${beds.body.beds.length}`);
})().catch(e => { console.error('TEST FAILED:', e.message); process.exit(1); });
