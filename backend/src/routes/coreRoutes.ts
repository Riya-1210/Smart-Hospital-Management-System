import { Router, json } from 'express';
import { query, execute } from '../config/database';
import { authenticate, requireRole } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';

/**
 * Core entity routes. All parameterized. Role-protected where sensitive:
 *  - Patients can read their own data; staff roles read hospital-wide.
 *  - Writes require staff roles (ADMIN/DOCTOR/NURSE).
 */
const router = Router();
router.use(json());
router.use(authenticate);

const STAFF = ['ADMIN', 'DOCTOR', 'NURSE'];

/** Helper: restrict SELECTs so patients only see their own rows. */
function patientScope(patientId: number | null | undefined): { clause: string; params: unknown[] } {
  if (patientId != null) return { clause: ' AND patient_id = ?', params: [patientId] };
  return { clause: '', params: [] };
}

// ─── Users (admin directory) ────────────────────────────────────────────────
router.get('/users', requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT u.user_id, u.full_name, u.email, u.phone, u.status, u.created_at, r.role_name AS role
       FROM users u JOIN roles r ON r.role_id = u.role_id ORDER BY u.user_id`
    );
    res.json({ users: rows });
  } catch (err) { next(err); }
});

router.get('/roles', requireRole('ADMIN'), async (_req, res, next) => {
  try {
    res.json({ roles: await query('SELECT role_id, role_name, description FROM roles ORDER BY role_id') });
  } catch (err) { next(err); }
});

// ─── Doctor's patient roster ────────────────────────────────────────────
// Every patient currently under a doctor's care, assembled from REAL
// relationship rows in the database (never a hardcoded list):
//   • appointments  → doctor-patient link (past + upcoming)
//   • emergency_cases → assigned doctor + admissions/ICU via assigned_bed_id
router.get('/doctor/patients', requireRole('DOCTOR', 'ADMIN', 'NURSE'), async (req, res, next) => {
  try {
    let doctorId: number | null = null;
    if (req.user!.role === 'DOCTOR') {
      const d = await query<Array<{ doctor_id: number }>>(
        'SELECT doctor_id FROM doctors WHERE user_id = ? LIMIT 1', [req.user!.user_id]);
      if (!d.length) return res.json({ patients: [] });
      doctorId = d[0].doctor_id;
    }
    // The doctor filter appears in BOTH halves of the UNION, so the
    // The same filter is bound once for each UNION branch.
    const params: unknown[] = [];
    if (doctorId != null) { params.push(doctorId, doctorId); }
    const doctorFilterAppointments = doctorId != null ? 'WHERE a.doctor_id = ?' : '';
    const doctorFilterEmergency = doctorId != null ? 'WHERE e.assigned_doctor_id = ?' : '';

    const rows = await query(
      `SELECT rel.patient_id,
              u.full_name,
              p.date_of_birth,
              p.gender,
              p.blood_group,
              u.phone,
              TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
              dep.department_name AS department,
              rel.doctor_id,
              du.full_name AS doctor_name,
              rel.link_type,
              rel.last_date,
              rel.latest_reason,
              rel.latest_status,
              rel.bed_number,
              rel.ward_name,
              rel.ward_type,
              rel.emergency_priority,
              rel.emergency_status,
              rel.emergency_id
       FROM (
         SELECT a.patient_id, a.doctor_id, 'APPOINTMENT' AS link_type,
                a.appointment_date AS last_date, a.reason AS latest_reason,
                a.status AS latest_status,
                NULL AS bed_number, NULL AS ward_name, NULL AS ward_type,
                NULL AS emergency_priority, NULL AS emergency_status, NULL AS emergency_id
         FROM appointments a
         ${doctorFilterAppointments}
         UNION ALL
         SELECT e.patient_id, e.assigned_doctor_id AS doctor_id, 'EMERGENCY' AS link_type,
                e.arrival_time AS last_date, e.condition_description AS latest_reason,
                e.status AS latest_status,
                b.bed_number, w.ward_name, w.ward_type,
                e.priority AS emergency_priority, e.status AS emergency_status, e.emergency_id
         FROM emergency_cases e
         LEFT JOIN beds b ON b.bed_id = e.assigned_bed_id
         LEFT JOIN wards w ON w.ward_id = b.ward_id
         ${doctorFilterEmergency}
       ) AS rel
       JOIN patients p ON p.patient_id = rel.patient_id
       JOIN users u ON u.user_id = p.user_id
       LEFT JOIN doctors d ON d.doctor_id = rel.doctor_id
       LEFT JOIN users du ON du.user_id = d.user_id
       LEFT JOIN departments dep ON dep.department_id = d.department_id
       ORDER BY rel.patient_id, rel.last_date DESC`,
      params);
    res.json({ patients: rows });
  } catch (err) { next(err); }
});

// ─── ICU patients (current ICU admissions) ─────────────────────────────
// "Admitted to ICU" = an active emergency/admission case whose assigned bed
// sits in an ICU ward (or is typed ICU). Derived entirely from the database.
router.get('/icu-patients', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT e.emergency_id,
              e.patient_id,
              u.full_name AS patient_name,
              p.date_of_birth,
              TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
              p.gender,
              e.priority,
              e.status,
              e.arrival_time,
              e.condition_description,
              b.bed_number,
              w.ward_name,
              w.ward_type,
              d.doctor_id AS assigned_doctor_id,
              du.full_name AS doctor_name,
              dep.department_name AS department
       FROM emergency_cases e
       JOIN beds b ON b.bed_id = e.assigned_bed_id
       JOIN wards w ON w.ward_id = b.ward_id
       JOIN patients p ON p.patient_id = e.patient_id
       JOIN users u ON u.user_id = p.user_id
       LEFT JOIN doctors d ON d.doctor_id = e.assigned_doctor_id
       LEFT JOIN users du ON du.user_id = d.user_id
       LEFT JOIN departments dep ON dep.department_id = d.department_id
       WHERE (b.bed_type = 'ICU' OR w.ward_type = 'ICU')
         AND e.status IN ('OPEN','IN_TREATMENT','STABLE')
       ORDER BY FIELD(e.priority,'CRITICAL','HIGH','MEDIUM','LOW'), e.arrival_time DESC`);
    res.json({ icu_patients: rows });
  } catch (err) { next(err); }
});

// ─── Departments ────────────────────────────────────────────────────────────
router.get('/departments', async (_req, res, next) => {
  try {
    res.json({ departments: await query('SELECT * FROM departments ORDER BY department_name') });
  } catch (err) { next(err); }
});

// ─── Patients ───────────────────────────────────────────────────────────────
router.get('/patients', requireRole(...STAFF), async (req, res, next) => {
  try {
    const search = `%${req.query.search || ''}%`;
    const rows = await query(
      `SELECT p.patient_id, u.full_name, u.email, u.phone, p.date_of_birth, p.gender,
              p.address, p.emergency_contact_name, p.emergency_contact_phone
       FROM patients p JOIN users u ON u.user_id = p.user_id
       WHERE u.full_name LIKE ? OR u.email LIKE ?
       ORDER BY p.patient_id LIMIT 200`,
      [search, search]
    );
    res.json({ patients: rows });
  } catch (err) { next(err); }
});

router.get('/patients/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = req.user!;
    // Patients may only view their own record
    if (user.role === 'PATIENT') {
      const own = await query<any[]>('SELECT patient_id FROM patients WHERE user_id = ?', [user.user_id]);
      if (!own.length || own[0].patient_id !== id) throw new HttpError(403, 'You can only view your own record');
    }
    const rows = await query(
      `SELECT p.*, u.full_name, u.email, u.phone
       FROM patients p JOIN users u ON u.user_id = p.user_id WHERE p.patient_id = ?`,
      [id]
    );
    if (!rows.length) throw new HttpError(404, 'Patient not found');
    res.json({ patient: rows[0] });
  } catch (err) { next(err); }
});

// ─── Doctors ────────────────────────────────────────────────────────────────
router.get('/doctors', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT d.doctor_id, d.user_id, u.full_name, u.email, u.phone, d.specialization,
              d.qualification, d.experience_years, d.consultation_fee, d.availability_status,
              dep.department_name, dep.department_id
       FROM doctors d
       JOIN users u ON u.user_id = d.user_id
       JOIN departments dep ON dep.department_id = d.department_id
       ORDER BY d.doctor_id`
    );
    res.json({ doctors: rows });
  } catch (err) { next(err); }
});

// ─── Appointments (role-scoped) ─────────────────────────────────────────────
router.get('/appointments', async (req, res, next) => {
  try {
    const user = req.user!;
    let rows: any[];
    if (user.role === 'PATIENT') {
      rows = await query(
        `SELECT a.*, p.user_id AS patient_user_id, pd.full_name AS patient_name, du.full_name AS doctor_name, dep.department_name
         FROM appointments a
         JOIN patients p ON p.patient_id = a.patient_id
         JOIN users pd ON pd.user_id = p.user_id
         JOIN doctors d ON d.doctor_id = a.doctor_id
         JOIN users du ON du.user_id = d.user_id
         JOIN departments dep ON dep.department_id = a.department_id
         WHERE p.user_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
        [user.user_id]
      );
    } else if (user.role === 'DOCTOR') {
      rows = await query(
        `SELECT a.*, p.user_id AS patient_user_id, pd.full_name AS patient_name, du.full_name AS doctor_name, dep.department_name
         FROM appointments a
         JOIN patients p ON p.patient_id = a.patient_id
         JOIN users pd ON pd.user_id = p.user_id
         JOIN doctors d ON d.doctor_id = a.doctor_id
         JOIN users du ON du.user_id = d.user_id
         JOIN departments dep ON dep.department_id = a.department_id
         WHERE a.doctor_id = (SELECT doctor_id FROM doctors WHERE user_id = ?)
         ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
        [user.user_id]
      );
    } else {
      rows = await query(
        `SELECT a.*, p.user_id AS patient_user_id, pd.full_name AS patient_name, du.full_name AS doctor_name, dep.department_name
         FROM appointments a
         JOIN patients p ON p.patient_id = a.patient_id
         JOIN users pd ON pd.user_id = p.user_id
         JOIN doctors d ON d.doctor_id = a.doctor_id
         JOIN users du ON du.user_id = d.user_id
         JOIN departments dep ON dep.department_id = a.department_id
         ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 300`
      );
    }
    res.json({ appointments: rows });
  } catch (err) { next(err); }
});

router.post('/appointments', requireRole('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'), async (req, res, next) => {
  try {
    const user = req.user!;
    const { doctor_id, appointment_date, appointment_time, reason, department_id } = req.body || {};
    if (!doctor_id || !appointment_date || !appointment_time) {
      throw new HttpError(400, 'doctor_id, appointment_date and appointment_time are required');
    }
    // Patients book for themselves; staff may book for any patient
    let patientId: number;
    if (user.role === 'PATIENT') {
      const own = await query<any[]>('SELECT patient_id FROM patients WHERE user_id = ? LIMIT 1', [user.user_id]);
      if (!own.length) throw new HttpError(400, 'No patient profile linked to this account');
      patientId = own[0].patient_id;
    } else {
      patientId = Number(req.body.patient_id);
      if (!patientId) throw new HttpError(400, 'patient_id is required');
    }
    const doc = await query<any[]>('SELECT department_id FROM doctors WHERE doctor_id = ?', [doctor_id]);
    if (!doc.length) throw new HttpError(404, 'Doctor not found');
    const ins = await execute(
      `INSERT INTO appointments (patient_id, doctor_id, department_id, appointment_date, appointment_time, reason, status)
       VALUES (?,?,?,?,?,?,'PENDING')`,
      [patientId, doctor_id, department_id ?? doc[0].department_id, appointment_date, appointment_time, reason ?? null]
    );
    res.status(201).json({ appointment_id: ins.insertId, status: 'PENDING' });
  } catch (err) { next(err); }
});

// ─── Beds & Wards ───────────────────────────────────────────────────────────
router.get('/beds', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT b.bed_id, b.bed_number, b.bed_type, b.status, w.ward_id, w.ward_name, w.ward_type, w.floor
       FROM beds b JOIN wards w ON w.ward_id = b.ward_id
       ORDER BY w.ward_id, b.bed_number`
    );
    res.json({ beds: rows });
  } catch (err) { next(err); }
});

router.get('/wards', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT w.*, COUNT(b.bed_id) AS total_beds,
              SUM(CASE WHEN b.status='AVAILABLE' THEN 1 ELSE 0 END) AS available_beds
       FROM wards w LEFT JOIN beds b ON b.ward_id = w.ward_id
       GROUP BY w.ward_id ORDER BY w.ward_id`
    );
    res.json({ wards: rows });
  } catch (err) { next(err); }
});

// ─── Medicines ──────────────────────────────────────────────────────────────
router.get('/medicines', async (_req, res, next) => {
  try {
    res.json({ medicines: await query('SELECT * FROM medicines ORDER BY medicine_name') });
  } catch (err) { next(err); }
});

// ─── Equipment ──────────────────────────────────────────────────────────────
router.get('/equipment', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT e.*, d.department_name FROM equipment e
       LEFT JOIN departments d ON d.department_id = e.department_id
       ORDER BY e.equipment_id`
    );
    res.json({ equipment: rows });
  } catch (err) { next(err); }
});

// ─── Prescriptions (role-scoped) ────────────────────────────────────────────
router.get('/prescriptions', async (req, res, next) => {
  try {
    const user = req.user!;
    const scope = user.role === 'PATIENT'
      ? { where: 'WHERE pa.user_id = ?', params: [user.user_id] }
      : user.role === 'DOCTOR'
        ? { where: 'WHERE pr.doctor_id = (SELECT doctor_id FROM doctors WHERE user_id = ?)', params: [user.user_id] }
        : { where: '', params: [] };
    const rows = await query(
      `SELECT pr.*, pu.full_name AS patient_name, du.full_name AS doctor_name
       FROM prescriptions pr
       JOIN patients pa ON pa.patient_id = pr.patient_id
       JOIN users pu ON pu.user_id = pa.user_id
       JOIN doctors d ON d.doctor_id = pr.doctor_id
       JOIN users du ON du.user_id = d.user_id
       ${scope.where}
       ORDER BY pr.prescription_date DESC LIMIT 200`,
      scope.params
    );
    // Attach items
    for (const pr of rows) {
      pr.items = await query(
        `SELECT pi.*, m.medicine_name, m.unit_price FROM prescription_items pi
         JOIN medicines m ON m.medicine_id = pi.medicine_id
         WHERE pi.prescription_id = ?`,
        [pr.prescription_id]
      );
    }
    res.json({ prescriptions: rows });
  } catch (err) { next(err); }
});

// ─── Medical records (role-scoped) ──────────────────────────────────────────
router.get('/medical-records', async (req, res, next) => {
  try {
    const user = req.user!;
    const scope = user.role === 'PATIENT'
      ? { where: 'WHERE p.user_id = ?', params: [user.user_id] }
      : user.role === 'DOCTOR'
        ? { where: 'WHERE mr.doctor_id = (SELECT doctor_id FROM doctors WHERE user_id = ?)', params: [user.user_id] }
        : { where: '', params: [] };
    const rows = await query(
      `SELECT mr.*, pu.full_name AS patient_name, du.full_name AS doctor_name
       FROM medical_records mr
       JOIN patients p ON p.patient_id = mr.patient_id
       JOIN users pu ON pu.user_id = p.user_id
       JOIN doctors d ON d.doctor_id = mr.doctor_id
       JOIN users du ON du.user_id = d.user_id
       ${scope.where}
       ORDER BY mr.record_date DESC LIMIT 200`,
      scope.params
    );
    res.json({ records: rows });
  } catch (err) { next(err); }
});

// ─── Lab reports (role-scoped) ──────────────────────────────────────────────
router.get('/lab-reports', async (req, res, next) => {
  try {
    const user = req.user!;
    const scope = user.role === 'PATIENT'
      ? { where: 'WHERE p.user_id = ?', params: [user.user_id] }
      : user.role === 'DOCTOR'
        ? { where: 'WHERE lr.doctor_id = (SELECT doctor_id FROM doctors WHERE user_id = ?)', params: [user.user_id] }
        : { where: '', params: [] };
    const rows = await query(
      `SELECT lr.*, pu.full_name AS patient_name
       FROM lab_reports lr
       JOIN patients p ON p.patient_id = lr.patient_id
       JOIN users pu ON pu.user_id = p.user_id
       ${scope.where}
       ORDER BY lr.test_date DESC LIMIT 200`,
      scope.params
    );
    res.json({ reports: rows });
  } catch (err) { next(err); }
});

// ─── Bills & payments (role-scoped) ─────────────────────────────────────────
router.get('/bills', async (req, res, next) => {
  try {
    const user = req.user!;
    const scope = user.role === 'PATIENT'
      ? { where: 'WHERE p.user_id = ?', params: [user.user_id] }
      : { where: '', params: [] };
    const rows = await query(
      `SELECT b.*, pu.full_name AS patient_name,
              (SELECT COALESCE(SUM(amount),0) FROM payments pay WHERE pay.bill_id = b.bill_id AND pay.status='SUCCESS') AS paid_amount
       FROM bills b
       JOIN patients p ON p.patient_id = b.patient_id
       JOIN users pu ON pu.user_id = p.user_id
       ${scope.where}
       ORDER BY b.bill_date DESC LIMIT 200`,
      scope.params
    );
    res.json({ bills: rows });
  } catch (err) { next(err); }
});

export default router;
