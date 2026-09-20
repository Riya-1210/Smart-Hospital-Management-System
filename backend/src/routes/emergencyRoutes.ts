import { Router, json } from 'express';
import { query, execute } from '../config/database';
import { authenticate, requireRole } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { runTriageWorkflow, classify } from '../agents/triageAgent';
import { findBestBed, reserveBed, confirmBed } from '../agents/bedAgent';
import { recommendDoctor, computeWorkloads } from '../agents/doctorAgent';

const router = Router();
router.use(json());
router.use(authenticate);

const STAFF = ['ADMIN', 'DOCTOR', 'NURSE'];
const CLINICAL = ['ADMIN', 'DOCTOR', 'NURSE'];

// ─── List emergency cases (staff) ───────────────────────────────────────────
router.get('/emergency', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT e.*, pu.full_name AS patient_name, p.gender, p.date_of_birth,
              du.full_name AS doctor_name, b.bed_number, w.ward_name
       FROM emergency_cases e
       JOIN patients p ON p.patient_id = e.patient_id
       JOIN users pu ON pu.user_id = p.user_id
       LEFT JOIN doctors d ON d.doctor_id = e.assigned_doctor_id
       LEFT JOIN users du ON du.user_id = d.user_id
       LEFT JOIN beds b ON b.bed_id = e.assigned_bed_id
       LEFT JOIN wards w ON w.ward_id = b.ward_id
       ORDER BY e.arrival_time DESC LIMIT 100`
    );
    res.json({ emergency_cases: rows });
  } catch (err) { next(err); }
});

// ─── AI Triage: run the Emergency Triage Agent ──────────────────────────────
router.post('/ai/triage', requireRole(...CLINICAL), async (req, res, next) => {
  try {
    const { name, age, gender, symptoms, vitals } = req.body || {};
    if (!symptoms || typeof symptoms !== 'string' || !vitals) {
      throw new HttpError(400, 'symptoms and vitals are required');
    }
    const result = await runTriageWorkflow(
      { name, age, gender, symptoms, vitals },
      req.user!.user_id
    );
    res.status(201).json({ triage: result });
  } catch (err) { next(err); }
});

/** Dry-run classification without persistence (used by UI preview). */
router.post('/ai/triage/classify', requireRole(...CLINICAL), async (req, res, next) => {
  try {
    const { symptoms, vitals } = req.body || {};
    if (!symptoms || !vitals) throw new HttpError(400, 'symptoms and vitals are required');
    res.json({ triage: classify({ symptoms, vitals }) });
  } catch (err) { next(err); }
});

// ─── Triage assessment review (human-in-the-loop) ───────────────────────────
router.get('/ai/triage', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT t.*, pu.full_name AS patient_name, e.priority AS case_priority, e.status AS case_status
       FROM triage_assessments t
       JOIN patients p ON p.patient_id = t.patient_id
       JOIN users pu ON pu.user_id = p.user_id
       JOIN emergency_cases e ON e.emergency_id = t.emergency_id
       ORDER BY t.created_at DESC LIMIT 100`
    );
    res.json({ triage_assessments: rows });
  } catch (err) { next(err); }
});

router.post('/ai/triage/:id/review', requireRole(...CLINICAL), async (req, res, next) => {
  try {
    const { decision, notes } = req.body || {};
    if (!['APPROVED', 'REJECTED', 'MODIFIED'].includes(decision)) {
      throw new HttpError(400, 'decision must be APPROVED, REJECTED or MODIFIED');
    }
    await execute(
      'UPDATE triage_assessments SET human_review_status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE triage_id = ?',
      [decision, req.user!.user_id, req.params.id]
    );
    await execute(
      `INSERT INTO ai_agent_logs (agent_id, agent_name, event_type, message, reference_type, reference_id, created_by)
       VALUES ('triage', 'Emergency Triage Agent', 'success', ?, 'triage_assessment', ?, ?)`,
      [`Human review: triage assessment #${req.params.id} ${decision.toLowerCase()} by ${req.user!.full_name}.`,
       req.params.id, req.user!.user_id]
    );
    res.json({ ok: true, decision });
  } catch (err) { next(err); }
});

// ─── AI Bed allocation ──────────────────────────────────────────────────────
router.post('/ai/bed-allocation', requireRole(...CLINICAL), async (req, res, next) => {
  try {
    const { emergency_id, patient_id, priority, icu_required, needs_ventilator } = req.body || {};
    if (!patient_id || !priority) throw new HttpError(400, 'patient_id and priority are required');
    const { recommendation, alternatives } = await findBestBed({
      priority, icuRequired: !!icu_required, needsVentilator: !!needs_ventilator,
    });
    if (!recommendation) return res.status(409).json({ error: 'No available beds', alternatives: [] });

    const reserved = await reserveBed({
      bedId: recommendation.bed_id,
      patientId: Number(patient_id),
      emergencyId: emergency_id ?? null,
      priority,
      matchScore: recommendation.match_score,
      confidence: recommendation.confidence,
      reason: recommendation.reason,
      factors: recommendation.factors,
      userId: req.user!.user_id,
    });
    if (!reserved) return res.status(409).json({ error: 'Bed was just taken — retry', alternatives });

    res.status(201).json({ allocation: { ...reserved, ...recommendation }, alternatives });
  } catch (err) { next(err); }
});

router.get('/ai/bed-allocation', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT ba.*, b.bed_number, w.ward_name, pu.full_name AS patient_name
       FROM bed_allocations ba
       JOIN beds b ON b.bed_id = ba.bed_id
       JOIN wards w ON w.ward_id = b.ward_id
       JOIN patients p ON p.patient_id = ba.patient_id
       JOIN users pu ON pu.user_id = p.user_id
       ORDER BY ba.created_at DESC LIMIT 100`
    );
    res.json({ allocations: rows });
  } catch (err) { next(err); }
});

/** Confirm a reserved bed into OCCUPIED (human confirms admission). */
router.post('/ai/bed-allocation/:id/confirm', requireRole(...CLINICAL), async (req, res, next) => {
  try {
    const rows = await query<any[]>('SELECT bed_id FROM bed_allocations WHERE allocation_id = ?', [req.params.id]);
    if (!rows.length) throw new HttpError(404, 'Allocation not found');
    await confirmBed(rows[0].bed_id);
    await execute("UPDATE bed_allocations SET status = 'CONFIRMED', human_review_status = 'APPROVED', reviewed_by = ? WHERE allocation_id = ?",
      [req.user!.user_id, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── AI Doctor scheduling ───────────────────────────────────────────────────
router.get('/ai/doctor-scheduling', requireRole(...STAFF), async (_req, res, next) => {
  try {
    const workloads = await computeWorkloads();
    res.json({ workload: workloads });
  } catch (err) { next(err); }
});

router.post('/ai/doctor-scheduling', requireRole(...CLINICAL), async (req, res, next) => {
  try {
    const { specialty_hint, icu_required, emergency_id } = req.body || {};
    const { suggestion, alternatives } = await recommendDoctor({
      specialtyHint: specialty_hint, icuRequired: !!icu_required, userId: req.user!.user_id, emergencyId: emergency_id ?? null,
    });
    if (!suggestion) return res.status(409).json({ error: 'No available doctors' });
    res.json({ suggestion, alternatives });
  } catch (err) { next(err); }
});

/** Assign the suggested doctor to an emergency case. */
router.post('/emergency/:id/assign-doctor', requireRole(...CLINICAL), async (req, res, next) => {
  try {
    const { doctor_id } = req.body || {};
    if (!doctor_id) throw new HttpError(400, 'doctor_id is required');
    await execute('UPDATE emergency_cases SET assigned_doctor_id = ?, status = "IN_TREATMENT" WHERE emergency_id = ?', [doctor_id, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── Outcome verification ───────────────────────────────────────────────────
router.get('/outcomes', requireRole(...STAFF), async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT o.*, pu.full_name AS patient_name
       FROM outcome_verifications o
       JOIN patients p ON p.patient_id = o.patient_id
       JOIN users pu ON pu.user_id = p.user_id
       ORDER BY o.created_at DESC LIMIT 100`
    );
    res.json({ outcomes: rows });
  } catch (err) { next(err); }
});

router.post('/outcomes', requireRole(...CLINICAL), async (req, res, next) => {
  try {
    const { emergency_id, appointment_id, patient_id, outcome, status, follow_up_date, verification, notes } = req.body || {};
    if (!patient_id) throw new HttpError(400, 'patient_id is required');
    const ins = await execute(
      `INSERT INTO outcome_verifications
         (emergency_id, appointment_id, patient_id, outcome, status, follow_up_date, verification, notes, reviewer_id, verified_at)
       VALUES (?,?,?,?,?,?,?,?,?,NOW())`,
      [emergency_id ?? null, appointment_id ?? null, patient_id, outcome ?? 'STABLE', status ?? 'OPEN',
       follow_up_date ?? null, verification ?? null, notes ?? null, req.user!.user_id]
    );
    await execute(
      `INSERT INTO ai_agent_logs (agent_id, agent_name, event_type, message, reference_type, reference_id, created_by)
       VALUES ('followup', 'Follow-up/Outcome Agent', 'success', ?, 'outcome', ?, ?)`,
      [`Follow-up/Outcome Agent recorded outcome for patient #${patient_id}: ${outcome || 'STABLE'}.`,
       String(ins.insertId), req.user!.user_id]
    );
    res.status(201).json({ outcome_id: ins.insertId });
  } catch (err) { next(err); }
});

export default router;
