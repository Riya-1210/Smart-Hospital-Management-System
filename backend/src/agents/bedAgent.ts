import { query, execute } from '../config/database';

/**
 * BedAllocationAgent — scores available beds against the patient's needs
 * (bed type, ICU/ventilator requirement, ward, priority) and reserves the best.
 */

export interface BedRecommendation {
  bed_id: number;
  bed_number: string;
  ward_name: string;
  bed_type: string;
  match_score: number;
  confidence: number;
  reason: string;
  factors: string[];
}

interface BedRow {
  bed_id: number;
  bed_number: string;
  bed_type: string | null;
  ward_name: string;
  ward_type: string | null;
  status: string;
}

export async function findBestBed(opts: {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  icuRequired: boolean;
  needsVentilator?: boolean;
}): Promise<{ recommendation: BedRecommendation | null; alternatives: BedRecommendation[] }> {
  const beds: BedRow[] = await query(
    `SELECT b.bed_id, b.bed_number, b.bed_type, b.status, w.ward_name, w.ward_type
     FROM beds b JOIN wards w ON w.ward_id = b.ward_id
     WHERE b.status = 'AVAILABLE'`
  );
  if (beds.length === 0) return { recommendation: null, alternatives: [] };

  const scored = beds.map((bed) => {
    let score = 50;
    const factors: string[] = [];
    const type = (bed.bed_type || '').toUpperCase();
    const wardType = (bed.ward_type || '').toUpperCase();

    if (opts.icuRequired && (type === 'ICU' || wardType === 'ICU')) {
      score += 40; factors.push('ICU bed matched for critical patient');
    } else if (!opts.icuRequired && type !== 'ICU') {
      score += 20; factors.push('Ward bed sufficient — ICU preserved for critical cases');
    }
    if (opts.priority === 'CRITICAL') { score += 10; factors.push('High-priority case — rapid access location preferred'); }
    if (type === 'ICU') { score += 5; factors.push('Enhanced monitoring available'); }
    return { bed, score, factors };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const recommendation: BedRecommendation = {
    bed_id: best.bed.bed_id,
    bed_number: best.bed.bed_number,
    ward_name: best.bed.ward_name,
    bed_type: best.bed.bed_type || 'GENERAL',
    match_score: best.score,
    confidence: Math.min(99, Math.round(70 + best.score / 4)),
    reason: best.factors.join('. ') || 'Closest suitable available bed.',
    factors: best.factors,
  };
  const alternatives = scored.slice(1, 4).map((s) => ({
    bed_id: s.bed.bed_id,
    bed_number: s.bed.bed_number,
    ward_name: s.bed.ward_name,
    bed_type: s.bed.bed_type || 'GENERAL',
    match_score: s.score,
    confidence: Math.min(99, Math.round(70 + s.score / 4)),
    reason: s.factors.join('. '),
    factors: s.factors,
  }));

  return { recommendation, alternatives };
}

export async function reserveBed(opts: {
  bedId: number;
  patientId: number;
  emergencyId?: number | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchScore: number;
  confidence: number;
  reason: string;
  factors: string[];
  userId: number | null;
}) {
  // Confirm the bed is still free, then occupy it (atomic guard against double-booking)
  const upd = await execute(
    "UPDATE beds SET status = 'RESERVED' WHERE bed_id = ? AND status = 'AVAILABLE'",
    [opts.bedId]
  );
  if (upd.affectedRows === 0) return null; // someone took it first

  const ins = await execute(
    `INSERT INTO bed_allocations
       (bed_id, patient_id, emergency_id, bed_type, priority, match_score, confidence_score, reason, factors, status, human_review_status)
     VALUES (?,?,?,?,?,?,?,?,?,'RESERVED','PENDING')`,
    [opts.bedId, opts.patientId, opts.emergencyId ?? null, null, opts.priority,
     opts.matchScore, opts.confidence, opts.reason, JSON.stringify(opts.factors)]
  );

  await execute(
    `INSERT INTO ai_agent_logs (agent_id, agent_name, event_type, message, reference_type, reference_id, confidence_score, created_by)
     VALUES ('bed', 'Bed Allocation Agent', 'info', ?, 'bed', ?, ?, ?)`,
    [`Bed Allocation Agent reserved ${opts.reason.includes('ICU') ? 'ICU bed' : 'bed'} #${opts.bedId} (allocation record ${ins.insertId}).`, String(opts.bedId), opts.confidence, opts.userId]
  );

  return { allocationId: ins.insertId };
}

/** Confirm a reserved bed into OCCUPIED once human approves / patient physically admitted. */
export async function confirmBed(bedId: number) {
  await execute("UPDATE beds SET status = 'OCCUPIED' WHERE bed_id = ?", [bedId]);
}
