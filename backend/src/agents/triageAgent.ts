import { query, execute } from '../config/database';

/**
 * TriageAgent — rule-based urgency classification (decision support, NOT a
 * medical device). Produces priority, risk score, confidence, recommended
 * action and human-readable reasoning from symptoms + vital signs.
 */

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TriageInput {
  name?: string;
  age?: number;
  gender?: string;
  symptoms: string;
  vitals: { bp: string; hr: number; spo2: number; temp: number; rr: number };
}

export interface TriageResult {
  priority: Priority;
  riskScore: number;
  confidence: number;
  recommendedAction: string;
  reasoning: string;
  suggestedDepartment: string;
  icuRequired: boolean;
}

interface Rule {
  test: (s: TriageInput) => boolean;
  priority: Priority | ((s: TriageInput) => Priority);
  department: string;
  icu: boolean;
  action: string;
  reason: string;
  weight: number; // baseline risk score
}

const RULES: Rule[] = [
  {
    test: (s) => /cardiac|chest pain|heart|myocardial|angina/i.test(s.symptoms) || (s.vitals.hr > 120 && s.vitals.spo2 < 92),
    priority: 'CRITICAL', department: 'Cardiology / Emergency', icu: true,
    action: 'Immediate emergency evaluation — ECG within 10 minutes, cardiology consult',
    reason: 'Chest pain/cardiac indicators with abnormal vitals suggest possible acute coronary syndrome.',
    weight: 92,
  },
  {
    test: (s) => /head|brain|unconscious|skull|seizure|stroke|tbi/i.test(s.symptoms),
    priority: 'CRITICAL', department: 'Neurology / Neurosurgery', icu: true,
    action: 'Immediate CT head, neurosurgical evaluation, airway protection',
    reason: 'Neurological red flags — risk of intracranial injury or stroke.',
    weight: 90,
  },
  {
    test: (s) => /trauma|accident|polytrauma|severe bleeding|hemorrhag/i.test(s.symptoms) || (s.vitals.hr > 120 && s.vitals.spo2 < 90),
    priority: 'CRITICAL', department: 'Emergency / Trauma', icu: true,
    action: 'Activate trauma protocol, two large-bore IVs, transfusion support',
    reason: 'Major trauma pattern with shock physiology — possible hemorrhage.',
    weight: 94,
  },
  {
    test: (s) => /breathing|respiratory|shortness of breath|dyspnea|asthma/i.test(s.symptoms) || s.vitals.spo2 < 90,
    priority: 'CRITICAL', department: 'Pulmonology / Emergency', icu: true,
    action: 'High-flow oxygen, ABG analysis, respiratory team consult',
    reason: 'Respiratory distress with hypoxia — risk of respiratory failure.',
    weight: 89,
  },
  {
    test: (s) => /burn|severe bleeding|heavy bleeding/i.test(s.symptoms),
    priority: 'HIGH', department: 'Emergency Surgery', icu: false,
    action: 'Wound management, surgical consult, IV fluids',
    reason: 'Significant tissue injury requiring surgical assessment.',
    weight: 74,
  },
  {
    test: (s) => /fracture|bone|ortho|broken/i.test(s.symptoms),
    priority: 'MEDIUM', department: 'Orthopedics', icu: false,
    action: 'X-ray and orthopedic assessment, analgesia, immobilization',
    reason: 'Musculoskeletal injury — urgent but stable.',
    weight: 55,
  },
  {
    test: (s) => /abdomen|abdominal|appendix|GI bleeding|hematemesis/i.test(s.symptoms),
    priority: 'MEDIUM', department: 'General Surgery', icu: false,
    action: 'Abdominal examination, imaging, surgical review',
    reason: 'Acute abdominal symptoms — requires surgical evaluation.',
    weight: 52,
  },
  {
    test: (s) => /fever|infection|cough|flu/i.test(s.symptoms),
    priority: (s) => (s.vitals.hr > 110 ? 'HIGH' : 'MEDIUM'),
    department: 'Internal Medicine', icu: false,
    action: 'Vital monitoring, lab work, symptomatic treatment',
    reason: 'Febrile illness — escalate if hemodynamically unstable.',
    weight: 45,
  },
  {
    test: () => true,
    priority: 'LOW', department: 'General Medicine', icu: false,
    action: 'Standard assessment queue, routine vitals monitoring',
    reason: 'No emergency red flags identified in presentation.',
    weight: 25,
  },
];

/** Small vital-sign modifiers layered on top of the matched rule. */
function vitalAdjustments(s: TriageInput, base: number): { score: number; notes: string[] } {
  let score = base;
  const notes: string[] = [];
  const sbp = parseInt(s.vitals.bp.split('/')[0], 10) || 120;
  if (sbp < 90) { score += 8; notes.push(`hypotension (SBP ${sbp})`); }
  if (s.vitals.hr > 120) { score += 6; notes.push(`tachycardia (HR ${s.vitals.hr})`); }
  if (s.vitals.spo2 < 92) { score += 7; notes.push(`hypoxia (SpO2 ${s.vitals.spo2}%)`); }
  if (s.vitals.temp >= 39) { score += 4; notes.push(`high fever (${s.vitals.temp}°C)`); }
  if (s.vitals.rr > 24) { score += 5; notes.push(`tachypnea (RR ${s.vitals.rr})`); }
  if (s.age !== undefined && s.age >= 70) { score += 3; notes.push('advanced age'); }
  return { score, notes };
}

export function classify(input: TriageInput): TriageResult {
  const rule = RULES.find((r) => r.test(input))!;
  const priority: Priority = typeof rule.priority === 'function' ? rule.priority(input) : rule.priority;
  const { score, notes } = vitalAdjustments(input, rule.weight);
  const riskScore = Math.min(99, Math.max(5, Math.round(score)));
  const confidence = Math.min(97, Math.max(70, 88 + notes.length * 2 - (notes.length === 0 ? 6 : 0)));

  const reasoning = rule.reason + (notes.length ? ` Contributing factors: ${notes.join(', ')}.` : ' Vitals within tolerable range.');

  return {
    priority,
    riskScore,
    confidence,
    recommendedAction: rule.action,
    reasoning,
    suggestedDepartment: rule.department,
    icuRequired: rule.icu,
  };
}

/** Persist an emergency case + its triage assessment + agent log in one transaction. */
export async function runTriageWorkflow(input: TriageInput, userId: number | null) {
  const result = classify(input);

  // Resolve or create the patient record
  let patientId: number | null = null;
  if (input.name) {
    const byName = await query<{ patient_id: number }[]>(
      `SELECT p.patient_id FROM patients p JOIN users u ON u.user_id = p.user_id
       WHERE u.full_name = ? LIMIT 1`, [input.name]);
    if (byName.length) patientId = byName[0].patient_id;
  }
  if (!patientId) {
    // Create a walk-in patient (users row + patients row) — emergency intake.
    // Role id is looked up from the roles table (PATIENT) — never hardcoded.
    const roleRows = await query<Array<{ role_id: number }>>(
      "SELECT role_id FROM roles WHERE role_name = 'PATIENT' LIMIT 1");
    const username = input.name || `Walk-in ${new Date().toISOString().slice(0, 10)}`;
    const email = `walkin.${Date.now()}@emergency.local`;
    const ins = await execute(
      'INSERT INTO users (role_id, full_name, email, password_hash, phone, status) VALUES (?,?,?,?,?, "ACTIVE")',
      [roleRows[0]?.role_id ?? 7, username, email, 'no-login-walkin', input.name ? '—' : null]
    );
    const userIdNew = ins.insertId;
    const pIns = await execute(
      'INSERT INTO patients (user_id, date_of_birth, gender) VALUES (?,?,?)',
      [userIdNew, null, input.gender || 'Unknown']
    );
    patientId = pIns.insertId;
  }

  // Create the emergency case
  const emIns = await execute(
    `INSERT INTO emergency_cases (patient_id, arrival_time, priority, condition_description, status)
     VALUES (?, NOW(), ?, ?, 'OPEN')`,
    [patientId, result.priority, input.symptoms]
  );
  const emergencyId = emIns.insertId;

  // Persist the AI assessment (human review starts PENDING)
  await execute(
    `INSERT INTO triage_assessments
       (emergency_id, patient_id, symptoms, condition_description, vital_signs, priority,
        risk_score, confidence_score, recommended_action, ai_reasoning, human_review_status)
     VALUES (?,?,?,?,?,?,?,?,?,?,'PENDING')`,
    [
      emergencyId, patientId, input.symptoms, input.symptoms,
      JSON.stringify(input.vitals), result.priority, result.riskScore, result.confidence,
      result.recommendedAction, result.reasoning,
    ]
  );

  // Agent feed entry
  await execute(
    `INSERT INTO ai_agent_logs (agent_id, agent_name, event_type, message, reference_type, reference_id, confidence_score, created_by)
     VALUES ('triage', 'Emergency Triage Agent', ?, ?, 'emergency_case', ?, ?, ?)`,
    [
      result.priority === 'CRITICAL' ? 'critical' : result.priority === 'HIGH' ? 'alert' : 'info',
      `Emergency Triage Agent classified case #${emergencyId} as ${result.priority} (risk ${result.riskScore}, confidence ${result.confidence}%).`,
      String(emergencyId), result.confidence, userId,
    ]
  );

  return { emergencyId, patientId, ...result };
}
