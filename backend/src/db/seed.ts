import { query, execute } from '../config/database';
import bcrypt from 'bcryptjs';

/**
 * Seeds/repairs the demo database for the final Smart Hospital Management
 * System. Idempotent — every section checks before inserting.
 *
 * Final roles: ADMIN, DOCTOR, NURSE, PATIENT (pharmacist/receptionist/lab
 * accounts are removed by migration 003).
 *
 * Patient distribution goal (realistic mixture, not uniform):
 *  - Regular OPD patients with upcoming appointments (2)
 *  - Admitted patients in general/private wards (2)
 *  - Emergency patients (6) — not every patient
 *  - ICU patients (3) — not every patient
 *  - Completed-appointment / discharged patients (3)
 *  → 14 patients total, ALL linked to a doctor via appointments/admissions
 *    or emergency cases.
 */

const DEMO_PATIENTS: Array<{
  email: string; name: string; phone: string; dob: string; gender: 'Male' | 'Female';
  address: string; ecn: string; ecp: string; bloodGroup: string;
}> = [
  { email: 'rahul@gmail.com',   name: 'Rahul Patil',    phone: '9000000010', dob: '2004-05-10', gender: 'Male',   address: 'Amravati, Maharashtra', ecn: 'Rajesh Patil',    ecp: '9000000090', bloodGroup: 'B+' },
  { email: 'sneha@gmail.com',   name: 'Sneha Joshi',    phone: '9000000011', dob: '2003-08-15', gender: 'Female', address: 'Amravati, Maharashtra', ecn: 'Sunita Joshi',    ecp: '9000000091', bloodGroup: 'O+' },
  { email: 'meera.patient@hospital.com',  name: 'Meera Iyer',      phone: '9000000012', dob: '1979-02-11', gender: 'Female', address: 'Nagpur, Maharashtra',   ecn: 'Anand Iyer',      ecp: '9000000092', bloodGroup: 'A+' },
  { email: 'vikram.patient@hospital.com', name: 'Vikram Deshmukh', phone: '9000000013', dob: '1966-11-02', gender: 'Male',   address: 'Nagpur, Maharashtra',   ecn: 'Kavita Deshmukh', ecp: '9000000093', bloodGroup: 'AB+' },
  { email: 'anita.patient@hospital.com',  name: 'Anita Kaur',      phone: '9000000014', dob: '1988-07-23', gender: 'Female', address: 'Pune, Maharashtra',     ecn: 'Harjeet Kaur',    ecp: '9000000094', bloodGroup: 'O-' },
  { email: 'ramesh.patient@hospital.com', name: 'Ramesh Gupta',    phone: '9000000015', dob: '1958-01-19', gender: 'Male',   address: 'Pune, Maharashtra',     ecn: 'Lata Gupta',      ecp: '9000000095', bloodGroup: 'B-' },
  { email: 'kavita.patient@hospital.com', name: 'Kavita Sharma',   phone: '9000000016', dob: '1992-09-30', gender: 'Female', address: 'Amravati, Maharashtra', ecn: 'Deepak Sharma',   ecp: '9000000096', bloodGroup: 'A-' },
  { email: 'suresh.patient@hospital.com', name: 'Suresh Menon',    phone: '9000000017', dob: '1971-04-05', gender: 'Male',   address: 'Mumbai, Maharashtra',   ecn: 'Lakshmi Menon',   ecp: '9000000097', bloodGroup: 'O+' },
  { email: 'preeti.patient@hospital.com', name: 'Preeti Nair',     phone: '9000000018', dob: '1984-12-14', gender: 'Female', address: 'Mumbai, Maharashtra',   ecn: 'Rohan Nair',      ecp: '9000000098', bloodGroup: 'B+' },
  { email: 'arjun.patient@hospital.com',  name: 'Arjun Khanna',    phone: '9000000019', dob: '1996-06-08', gender: 'Male',   address: 'Nashik, Maharashtra',   ecn: 'Nisha Khanna',    ecp: '9000000099', bloodGroup: 'AB-' },
  { email: 'lakshmi.patient@hospital.com',name: 'Lakshmi Reddy',   phone: '9000000020', dob: '1954-03-27', gender: 'Female', address: 'Nashik, Maharashtra',   ecn: 'Krishna Reddy',   ecp: '9000000100', bloodGroup: 'A+' },
  { email: 'mohan.patient@hospital.com',  name: 'Mohan Rao',       phone: '9000000021', dob: '1949-10-21', gender: 'Male',   address: 'Nagpur, Maharashtra',   ecn: 'Gauri Rao',       ecp: '9000000101', bloodGroup: 'B+' },
  { email: 'farah.patient@hospital.com',  name: 'Farah Khan',      phone: '9000000022', dob: '1999-08-03', gender: 'Female', address: 'Pune, Maharashtra',     ecn: 'Imran Khan',      ecp: '9000000102', bloodGroup: 'O+' },
  { email: 'deepak.patient@hospital.com', name: 'Deepak Shinde',   phone: '9000000023', dob: '1962-05-16', gender: 'Male',   address: 'Amravati, Maharashtra', ecn: 'Vaishali Shinde', ecp: '9000000103', bloodGroup: 'A+' },
];

/** department_id by name */
async function departmentIdByName(name: string): Promise<number | null> {
  const rows = await query<Array<{ department_id: number }>>(
    'SELECT department_id FROM departments WHERE department_name = ? LIMIT 1', [name]);
  return rows[0]?.department_id ?? null;
}

async function roleMap(): Promise<Map<string, number>> {
  const roles = await query<Array<{ role_id: number; role_name: string }>>('SELECT role_id, role_name FROM roles');
  return new Map(roles.map((r) => [r.role_name, r.role_id]));
}

async function ensureDoctor(
  rm: Map<string, number>, hash: string,
  email: string, name: string, phone: string,
  specialization: string, deptName: string, license: string,
  qualification: string, experience: number, fee: string
): Promise<number> {
  const existingUser = await query<Array<{ user_id: number }>>('SELECT user_id FROM users WHERE email = ?', [email]);
  if (existingUser.length) {
    const d = await query<Array<{ doctor_id: number }>>('SELECT doctor_id FROM doctors WHERE user_id = ?', [existingUser[0].user_id]);
    if (d.length) return d[0].doctor_id;
  }
  const deptId = await departmentIdByName(deptName);
  const insUser = await execute(
    "INSERT INTO users (role_id, full_name, email, password_hash, phone, status) VALUES (?,?,?,?,?, 'ACTIVE')",
    [rm.get('DOCTOR'), name, email, hash, phone]
  );
  const insDoc = await execute(
    `INSERT INTO doctors (user_id, department_id, specialization, license_number, qualification, experience_years, consultation_fee, availability_status)
     VALUES (?,?,?,?,?,?,?,'AVAILABLE')`,
    [insUser.insertId, deptId, specialization, license, qualification, experience, fee]
  );
  console.log(`  ✓ created doctor ${name} (${specialization})`);
  return insDoc.insertId;
}

async function ensurePatientUser(p: typeof DEMO_PATIENTS[number], rm: Map<string, number>, hash: string): Promise<number> {
  const existing = await query<Array<{ patient_id: number }>>(
    `SELECT p.patient_id FROM patients p JOIN users u ON u.user_id = p.user_id WHERE u.email = ?`, [p.email]);
  if (existing.length) return existing[0].patient_id;

  const insUser = await execute(
    "INSERT INTO users (role_id, full_name, email, password_hash, phone, status) VALUES (?,?,?,?,?, 'ACTIVE')",
    [rm.get('PATIENT'), p.name, p.email, hash, p.phone]
  );
  const insPat = await execute(
    `INSERT INTO patients (user_id, date_of_birth, gender, blood_group, address, emergency_contact_name, emergency_contact_phone)
     VALUES (?,?,?,?,?,?,?)`,
    [insUser.insertId, p.dob, p.gender, p.bloodGroup, p.address, p.ecn, p.ecp]
  );
  return insPat.insertId;
}

export async function seed() {
  console.log('→ Seeding…');
  const hash = bcrypt.hashSync(process.env.DEMO_PASSWORD || 'demo123', 10);
  const rm = await roleMap();

  // ── 1. Core staff accounts ──────────────────────────────────────────────
  const adminUser = await query<Array<{ user_id: number }>>('SELECT user_id FROM users WHERE email = ?', ['admin@hospital.com']);
  if (!adminUser.length) {
    await execute("INSERT INTO users (role_id, full_name, email, password_hash, phone, status) VALUES (?,?,?,?,?, 'ACTIVE')",
      [rm.get('ADMIN'), 'Admin User', 'admin@hospital.com', hash, '9000000001']);
    console.log('  ✓ created admin@hospital.com');
  }

  // Two doctors (primary = Dr. Amit Sharma, Cardiology) — supports the
  // "patients are distributed, not all under one doctor" requirement.
  const doctor1 = await ensureDoctor(rm, hash,
    'amit@hospital.com', 'Dr. Amit Sharma', '9000000002',
    'Cardiologist', 'Cardiology', 'MH-DOC-1001', 'MBBS, MD Cardiology', 8, '700.00');
  const doctor2 = await ensureDoctor(rm, hash,
    'priya@hospital.com', 'Dr. Priya Patil', '9000000003',
    'Neurologist', 'Neurology', 'MH-DOC-1002', 'MBBS, MD Neurology', 6, '600.00');

  // ── 2. Nurse account ────────────────────────────────────────────────────
  const nurseUser = await query<Array<{ user_id: number }>>('SELECT user_id FROM users WHERE email = ?', ['nurse@hospital.com']);
  if (!nurseUser.length) {
    await execute("INSERT INTO users (role_id, full_name, email, password_hash, phone, status) VALUES (?,?,?,?,?, 'ACTIVE')",
      [rm.get('NURSE'), 'Nurse Ananya Kulkarni', 'nurse@hospital.com', hash, '9000000004']);
    console.log('  ✓ created nurse@hospital.com');
  }

  // ── 3. Upgrade any remaining non-bcrypt password placeholders ───────────
  const users: Array<{ user_id: number; password_hash: string }> = await query('SELECT user_id, password_hash FROM users');
  let fixed = 0;
  for (const u of users) {
    if (!u.password_hash.startsWith('$2')) {
      await execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, u.user_id]);
      fixed++;
    }
  }
  if (fixed) console.log(`  ✓ upgraded ${fixed} placeholder password(s)`);

  // ── 4. Patient roster (14 patients, realistic mixture) ──────────────────
  const patientIds: number[] = [];
  for (const p of DEMO_PATIENTS) {
    patientIds.push(await ensurePatientUser(p, rm, hash));
  }
  console.log(`  ✓ ${patientIds.length} patients verified/created`);

  // ── 5. Doctor availability ──────────────────────────────────────────────
  const availCounts = await query<Array<{ doctor_id: number; c: number }>>(
    'SELECT doctor_id, COUNT(*) c FROM doctor_availability GROUP BY doctor_id');
  const haveAvail = new Set(availCounts.filter((a) => a.c > 0).map((a) => a.doctor_id));
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  for (const d of [doctor1, doctor2]) {
    if (!haveAvail.has(d)) {
      for (const day of days) {
        await execute('INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)',
          [d, day, '09:00:00', '17:00:00']);
      }
    }
  }  // ── 6. Appointments — multiple, realistic, spread over both doctors ─────
  // Dates are computed by the database adapter as today plus an offset so the demo
  // always has appointments "today" no matter when the seed runs.
  // (Previously offsets were baked in at author time and aged out.)
  {
    // [patientIdx, doctorId, deptName, dayOffset, time, reason, status]
    const appts: Array<[number, number, string, number, string, string, string]> = [
      // Dr. Amit Sharma — 21 appointments TODAY (busy clinic day, mixed statuses)
      [0,  doctor1, 'Cardiology', 0, '09:00:00', 'Cardiac consultation',            'COMPLETED'],
      [1,  doctor1, 'Cardiology', 0, '09:30:00', 'Hypertension review',             'COMPLETED'],
      [2,  doctor1, 'Cardiology', 0, '10:00:00', 'Chest pain follow-up',            'COMPLETED'],
      [3,  doctor1, 'Cardiology', 0, '10:30:00', 'Post-angioplasty check',          'COMPLETED'],
      [4,  doctor1, 'Cardiology', 0, '11:00:00', 'Cardiac risk assessment',         'COMPLETED'],
      [5,  doctor1, 'Cardiology', 0, '11:30:00', 'ECG review',                      'COMPLETED'],
      [6,  doctor1, 'Cardiology', 0, '12:00:00', 'Palpitation consultation',        'COMPLETED'],
      [7,  doctor1, 'Cardiology', 0, '12:30:00', 'Cholesterol management',          'CONFIRMED'],
      [8,  doctor1, 'Cardiology', 0, '14:00:00', 'Arrhythmia evaluation',           'CONFIRMED'],
      [9,  doctor1, 'Cardiology', 0, '14:30:00', 'Heart failure follow-up',         'CONFIRMED'],
      [11, doctor1, 'Cardiology', 0, '15:00:00', 'Blood pressure check',            'CONFIRMED'],
      [12, doctor1, 'Cardiology', 0, '15:30:00', 'Stress test consultation',        'CONFIRMED'],
      [0,  doctor1, 'Cardiology', 0, '16:00:00', 'Echocardiogram review',           'PENDING'],
      [2,  doctor1, 'Cardiology', 0, '16:30:00', 'Medication review',               'PENDING'],
      [4,  doctor1, 'Cardiology', 0, '17:00:00', 'Cardiac rehab discussion',        'PENDING'],
      [6,  doctor1, 'Cardiology', 0, '17:30:00', 'Pre-operative cardiac clearance', 'PENDING'],
      [8,  doctor1, 'Cardiology', 0, '18:00:00', 'Pacemaker check',                 'PENDING'],
      [9,  doctor1, 'Cardiology', 0, '18:30:00', 'Family history counselling',      'PENDING'],
      [11, doctor1, 'Cardiology', 0, '19:00:00', 'Second-opinion consultation',     'PENDING'],
      [12, doctor1, 'Cardiology', 0, '19:30:00', 'Post-trauma cardiac review',      'PENDING'],
      [1,  doctor1, 'Cardiology', 0, '20:00:00', 'Evening cardiac review',          'PENDING'],
      // Surrounding days — history and upcoming, both doctors
      [0,  doctor1, 'Cardiology', -21, '10:30:00', 'Cardiac consultation',   'COMPLETED'],
      [2,  doctor1, 'Cardiology',  -7, '12:00:00', 'Chest pain review',      'COMPLETED'],
      [5,  doctor1, 'Cardiology', -10, '09:00:00', 'Cardiac screening',      'COMPLETED'],
      [7,  doctor1, 'Cardiology', -30, '10:30:00', 'Cardiac screening',      'COMPLETED'],
      [8,  doctor1, 'Cardiology',  -5, '11:00:00', 'Pre-operative cardiac clearance', 'COMPLETED'],
      [11, doctor1, 'Cardiology',  -3, '14:00:00', 'Cardiac evaluation',     'COMPLETED'],
      [1,  doctor1, 'Cardiology',   2, '10:00:00', 'Cardiac follow-up',      'CONFIRMED'],
      [3,  doctor1, 'Cardiology',   4, '14:30:00', 'Hypertension consult',   'PENDING'],
      [6,  doctor1, 'Cardiology',   6, '15:30:00', 'Palpitation checkup',    'PENDING'],
      [9,  doctor1, 'Cardiology',   9, '11:00:00', 'Post-trauma cardiac review', 'PENDING'],
      [4,  doctor2, 'Neurology',  -14, '11:00:00', 'Neurology consultation', 'COMPLETED'],
      [9,  doctor2, 'Neurology',   -2, '13:00:00', 'Headache evaluation',    'COMPLETED'],
      [4,  doctor2, 'Neurology',    1, '12:30:00', 'Migraine follow-up',     'CONFIRMED'],
      [5,  doctor2, 'Neurology',    3, '16:00:00', 'Vertigo consultation',   'CONFIRMED'],
      [10, doctor2, 'Neurology',    7, '10:00:00', 'Neuropathy review',      'PENDING'],
      [13, doctor2, 'Neurology',    8, '17:00:00', 'Memory assessment',      'PENDING'],
    ];
    for (const [pIdx, docId, dept, off, time, reason, status] of appts) {
      const deptId = await departmentIdByName(dept);
      const exists = await query<Array<{ c: number }>>(
        'SELECT COUNT(*) c FROM appointments WHERE patient_id = ? AND doctor_id = ? AND appointment_date = CURDATE() + INTERVAL ? DAY AND appointment_time = ?',
        [patientIds[pIdx], docId, off, time]);
      if (exists[0].c === 0) {
        await execute(
          `INSERT INTO appointments (patient_id, doctor_id, department_id, appointment_date, appointment_time, reason, status, created_at)
           VALUES (?,?,?, CURDATE() + INTERVAL ? DAY, ?, ?, ?, NOW())`,
          [patientIds[pIdx], docId, deptId, off, time, reason, status]);
      }
    }
    console.log('  ✓ appointments verified (21 today + surrounding days, mixed statuses, both doctors)');
  }

  // ── 7. Emergency cases — several patients, realistic mix ────────────────
  const emergencySeed: Array<[number, number | null, string, string, string]> = [
    // [patientIdx, doctorId, priority, description, status]
    [0,  doctor1, 'CRITICAL', 'Chest pain and weakness — suspected cardiac event', 'IN_TREATMENT'],
    [3,  doctor1, 'CRITICAL', 'Severe chest pain, shortness of breath, sweating',  'IN_TREATMENT'],
    [4,  doctor2, 'HIGH',     'Severe head trauma after fall, unconscious',        'IN_TREATMENT'],
    [5,  null,    'HIGH',     'Abdominal injury, internal bleeding suspected',     'OPEN'],
    [6,  null,    'MEDIUM',   'Fractured femur after road accident',               'OPEN'],
    [11, null,    'MEDIUM',   'High fever with confusion — suspected sepsis',      'OPEN'],
  ];
  for (const [pIdx, docId, priority, description, status] of emergencySeed) {
    const exists = await query<Array<{ c: number }>>(
      'SELECT COUNT(*) c FROM emergency_cases WHERE patient_id = ? AND condition_description = ?',
      [patientIds[pIdx], description]);
    if (exists[0].c === 0) {
      await execute(
        `INSERT INTO emergency_cases (patient_id, assigned_doctor_id, assigned_bed_id, arrival_time, priority, condition_description, status)
         VALUES (?,?,NULL,?,?,?,?)`,
        [patientIds[pIdx], docId, new Date(Date.now() - (pIdx % 6) * 3600 * 1000), priority, description, status]);
    }
  }
  console.log('  ✓ emergency cases verified (6 cases across 6 patients)');

  // ── 8. ICU admissions — 3 patients currently in ICU ─────────────────────
  // Uses emergency_cases.assigned_bed_id (the schema's ICU admission record).
  const icuSeed: Array<[number, number, string, string, string, string]> = [
    // [patientIdx, doctorId, bedNumber, priority, description, status]
    [1,  doctor1, 'ICU-01', 'CRITICAL', 'Acute myocardial infarction — cardiac ICU monitoring', 'IN_TREATMENT'],
    [7,  doctor1, 'ICU-02', 'CRITICAL', 'Congestive heart failure — ventilator support',        'IN_TREATMENT'],
    [10, doctor2, 'ICU-03', 'HIGH',     'Post-neurosurgery observation',                        'STABLE'],
  ];
  for (const [pIdx, docId, bedNumber, priority, description, status] of icuSeed) {
    const bedRow = await query<Array<{ bed_id: number }>>('SELECT bed_id FROM beds WHERE bed_number = ? LIMIT 1', [bedNumber]);
    if (!bedRow.length) continue;
    const bedId = bedRow[0].bed_id;

    await execute("UPDATE beds SET status = 'OCCUPIED' WHERE bed_id = ?", [bedId]);

    const exists = await query<Array<{ c: number }>>(
      'SELECT COUNT(*) c FROM emergency_cases WHERE patient_id = ? AND assigned_bed_id = ?',
      [patientIds[pIdx], bedId]);
    if (exists[0].c === 0) {
      await execute(
        `INSERT INTO emergency_cases (patient_id, assigned_doctor_id, assigned_bed_id, arrival_time, priority, condition_description, status)
         VALUES (?,?,?,?,?,?,?)`,
        [patientIds[pIdx], docId, bedId, new Date(Date.now() - 86400 * 1000 * (1 + (pIdx % 2))), priority, description, status]);
    }
  }
  console.log('  ✓ ICU admissions verified (3 patients in ICU beds)');

  // ── 9. General/private ward admissions (assigned non-ICU beds) ──────────
  const wardSeed: Array<[number, number, string, string, string, string]> = [
    [12, doctor1, 'G-102', 'MEDIUM', 'Pneumonia — IV antibiotics', 'IN_TREATMENT'],
    [13, doctor2, 'P-101', 'LOW',    'Elective surgery recovery',  'STABLE'],
  ];
  for (const [pIdx, docId, bedNumber, priority, description, status] of wardSeed) {
    const bedRow = await query<Array<{ bed_id: number }>>('SELECT bed_id FROM beds WHERE bed_number = ? LIMIT 1', [bedNumber]);
    if (!bedRow.length) continue;
    await execute("UPDATE beds SET status = 'OCCUPIED' WHERE bed_id = ?", [bedRow[0].bed_id]);
    const exists = await query<Array<{ c: number }>>(
      'SELECT COUNT(*) c FROM emergency_cases WHERE patient_id = ? AND assigned_bed_id IS NOT NULL',
      [patientIds[pIdx]]);
    if (exists[0].c === 0) {
      await execute(
        `INSERT INTO emergency_cases (patient_id, assigned_doctor_id, assigned_bed_id, arrival_time, priority, condition_description, status)
         VALUES (?,?,?,?,?,?,?)`,
        [patientIds[pIdx], docId, bedRow[0].bed_id, new Date(Date.now() - 172800 * 1000), priority, description, status]);
    }
  }

  // ── 10. Equipment (only if empty) ────────────────────────────────────────
  const equipCount = await query<Array<{ c: number }>>('SELECT COUNT(*) c FROM equipment');
  if (equipCount[0].c === 0) {
    const equipment = [
      ['Ventilator — V60 Plus', 2, 6, 'GOOD', 'AVAILABLE', '2026-08-15', '2026-11-15'],
      ['Ventilator — V60 Plus', 2, 4, 'GOOD', 'IN_USE', '2026-08-15', '2026-11-15'],
      ['Defibrillator — Lifepak 20', 9, 5, 'EXCELLENT', 'AVAILABLE', '2026-08-20', '2026-12-01'],
      ['Patient Monitor — IntelliVue', 2, 12, 'GOOD', 'AVAILABLE', '2026-07-30', '2026-10-30'],
      ['X-Ray Machine — Digital', 5, 2, 'GOOD', 'AVAILABLE', '2026-06-10', '2026-09-30'],
      ['Ultrasound — EPIQ 7', 5, 3, 'EXCELLENT', 'AVAILABLE', '2026-07-15', '2026-11-01'],
      ['ECG Machine — MAC 2000', 1, 8, 'GOOD', 'AVAILABLE', '2026-08-01', '2026-12-15'],
      ['CT Scanner — Revolution', 5, 1, 'GOOD', 'AVAILABLE', '2026-05-20', '2026-10-01'],
      ['Dialysis Machine', 5, 4, 'FAIR', 'MAINTENANCE', '2026-04-10', '2026-09-20'],
      ['Infusion Pump — Plum 360', 2, 15, 'GOOD', 'AVAILABLE', '2026-08-10', '2026-12-20'],
    ];
    for (const e of equipment) {
      await execute(
        'INSERT INTO equipment (equipment_name, department_id, quantity, equipment_condition, status, last_maintenance_date, next_maintenance_date) VALUES (?,?,?,?,?,?,?)',
        e);
    }
    console.log('  ✓ equipment seeded (10 rows)');
  }

  // ── 11. Medicines: add shortage-demo items only if missing ──────────────
  const medNames = await query<Array<{ medicine_name: string }>>('SELECT medicine_name FROM medicines');
  const haveMeds = new Set(medNames.map((m) => m.medicine_name));
  const medSeed = [
    ['Propofol 200mg/20mL', 'Anaesthetic', 42, 55.0, '2027-01-31', 60, 'Pfizer', 'AVAILABLE'],
    ['Midazolam 5mg/mL', 'Sedative', 25, 32.0, '2026-12-31', 30, 'Roche', 'AVAILABLE'],
    ['Atropine 0.6mg/mL', 'Emergency', 35, 18.0, '2027-03-31', 15, 'Wockhardt', 'AVAILABLE'],
    ['Insulin Actrapid', 'Endocrine', 60, 240.0, '2026-10-15', 20, 'Novo Nordisk', 'AVAILABLE'],
  ];
  for (const m of medSeed) {
    if (!haveMeds.has(m[0] as string)) {
      await execute(
        'INSERT INTO medicines (medicine_name, category, quantity, unit_price, expiry_date, reorder_level, supplier, status) VALUES (?,?,?,?,?,?,?,?)',
        m);
    }
  }
  console.log('  ✓ medicines verified');

  // ── 12. One completed outcome so follow-up views have data ──────────────
  const outCount = await query<Array<{ c: number }>>('SELECT COUNT(*) c FROM outcome_verifications');
  if (outCount[0].c === 0) {
    const em = await query<Array<{ emergency_id: number }>>(
      'SELECT emergency_id FROM emergency_cases WHERE patient_id = ? LIMIT 1', [patientIds[0]]);
    if (em.length) {
      await execute(
        `INSERT INTO outcome_verifications (emergency_id, patient_id, outcome, status, follow_up_date, verification, notes)
         VALUES (?,?,'IMPROVING','MONITORING',DATE_ADD(CURDATE(), INTERVAL 7 DAY),'Pending verification','Initial cardiac care completed — monitoring recovery')`,
        [em[0].emergency_id, patientIds[0]]);
    }
  }

  await seedPatientCharts(patientIds);

  console.log('✓ Seed complete.');
}

// ── Demo patient's prescriptions + medical record (idempotent) ────────────
// So the Patient login shows DB-backed prescriptions, records and history.
async function seedPatientCharts(patientIds: number[]) {
  const pid = patientIds[0]; // Rahul Patil — the primary demo patient login
  const doctorId = 1;       // Dr. Amit Sharma (primary demo doctor)

  const haveRx = await query<Array<{ c: number }>>(
    'SELECT COUNT(*) c FROM prescriptions WHERE patient_id = ?', [pid]);
  if (haveRx[0].c === 0) {
    const rx = await execute(
      `INSERT INTO prescriptions (patient_id, doctor_id, prescription_date, instructions)
       VALUES (?,?,NOW(),'Take medication with meals. Return for review in 2 weeks.')`,
      [pid, doctorId]);
    const items: Array<[string, string, string, string]> = [
      ['1 tablet', 'Once daily after food', '30 days', 'For heart protection'],
      ['1 tablet', 'At night', '30 days', 'Cholesterol management'],
      ['1 tablet', 'Twice daily', '30 days', 'Blood pressure control'],
    ];
    const medIds: Array<{ medicine_id: number; medicine_name: string }> = await query(
      "SELECT medicine_id, medicine_name FROM medicines WHERE medicine_name LIKE 'Paracetamol%' OR medicine_name LIKE 'Amoxicillin%' OR medicine_name LIKE 'Cetirizine%' ORDER BY medicine_id LIMIT 3");
    for (let i = 0; i < Math.min(3, medIds.length); i++) {
      const [dose, freq, dur, ins] = items[i];
      await execute(
        `INSERT INTO prescription_items (prescription_id, medicine_id, dosage, frequency, duration, instructions)
         VALUES (?,?,?,?,?,?)`,
        [rx.insertId, medIds[i].medicine_id, dose, freq, dur, ins]);
    }
    console.log('  ✓ demo patient prescription created (with 3 items)');
  }

  const haveMr = await query<Array<{ c: number }>>(
    'SELECT COUNT(*) c FROM medical_records WHERE patient_id = ?', [pid]);
  if (haveMr[0].c === 0) {
    await execute(
      `INSERT INTO medical_records (patient_id, doctor_id, diagnosis, symptoms, treatment, notes, record_date)
       VALUES (?,?,?,?,?,?,NOW())`,
      [pid, doctorId,
       'Stable angina — under management',
       'Exertional chest discomfort, relieved by rest',
       'Medication review and lifestyle counselling',
       'Continue current medications; review in 2 weeks']);
    console.log('  ✓ demo patient medical record created');
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('✗ Seed failed:', err.message);
      process.exit(1);
    });
}
