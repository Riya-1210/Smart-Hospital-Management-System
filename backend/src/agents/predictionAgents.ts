import { query, execute } from '../config/database';

/**
 * MedicinePredictionAgent — deterministic demo forecasting from real
 * inventory data (NOT a medical forecasting service).
 */

export interface MedicinePrediction {
  medicine_id: number;
  medicine_name: string;
  category: string | null;
  current_quantity: number;
  estimated_daily_usage: number;
  days_remaining: number;
  shortage_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  predicted_shortage_date: string | null;
  expiry_risk: boolean;
  recommended_reorder_quantity: number;
  confidence_score: number;
  recommendation: string;
}

export async function predictMedicineDemand(): Promise<MedicinePrediction[]> {
  const rows = await query<any[]>(
    `SELECT medicine_id, medicine_name, category, quantity, reorder_level, expiry_date
     FROM medicines ORDER BY medicine_name`
  );
  const out: MedicinePrediction[] = [];

  for (const r of rows) {
    const qty = Number(r.quantity || 0);
    const reorderLevel = Number(r.reorder_level || 10);
    // Deterministic usage estimate: proportional to stock size, min 3/day (demo model)
    const daily = Math.max(3, Math.round(qty / 30));
    const daysLeft = daily > 0 ? Math.floor(qty / daily) : 99;
    const expiryDate = r.expiry_date ? new Date(r.expiry_date) : null;
    const daysToExpiry = expiryDate ? Math.round((expiryDate.getTime() - Date.now()) / 86400000) : 999;
    const expiryRisk = daysToExpiry < 60 && daysLeft > daysToExpiry;

    let risk: MedicinePrediction['shortage_risk'] = 'LOW';
    if (daysLeft <= 2 || qty <= reorderLevel / 2) risk = 'CRITICAL';
    else if (daysLeft <= 4 || qty <= reorderLevel) risk = 'HIGH';
    else if (daysLeft <= 10) risk = 'MODERATE';

    const shortageDate = risk === 'LOW' ? null : new Date(Date.now() + daysLeft * 86400000).toISOString().slice(0, 10);
    const reorderQty = risk === 'LOW' ? 0 : Math.max(20, Math.round(daily * 14));
    const confidence = Math.min(96, 72 + Math.min(20, Math.round(qty / 50)));

    const rec =
      expiryRisk ? `${reorderQty} units at expiry risk — prioritize usage of older stock` :
      risk === 'CRITICAL' ? 'Emergency procurement required immediately' :
      risk === 'HIGH' ? `Reorder ~${reorderQty} units within 48 hours` :
      risk === 'MODERATE' ? `Plan reorder of ~${reorderQty} units this week` :
      'Stock healthy — no action needed';

    out.push({
      medicine_id: r.medicine_id, medicine_name: r.medicine_name, category: r.category,
      current_quantity: qty, estimated_daily_usage: daily, days_remaining: daysLeft,
      shortage_risk: risk, predicted_shortage_date: shortageDate, expiry_risk: expiryRisk,
      recommended_reorder_quantity: reorderQty, confidence_score: confidence, recommendation: rec,
    });

    await execute(
      `INSERT INTO medicine_predictions
         (medicine_id, current_quantity, estimated_daily_usage, days_remaining, shortage_risk, predicted_shortage_date, expiry_risk, recommended_reorder_quantity, confidence_score, recommendation)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [r.medicine_id, qty, daily, daysLeft, risk, shortageDate, expiryRisk ? 1 : 0, reorderQty, confidence, rec]
    );
  }

  // Agent feed entries for notable predictions
  for (const p of out.filter((x) => x.shortage_risk === 'HIGH' || x.shortage_risk === 'CRITICAL').slice(0, 3)) {
    await execute(
      `INSERT INTO ai_agent_logs (agent_id, agent_name, event_type, message, reference_type, reference_id, confidence_score)
       VALUES ('medicine', 'Medicine Prediction Agent', ?, ?, 'medicine', ?, ?)`,
      [
        p.shortage_risk === 'CRITICAL' ? 'critical' : 'alert',
        `Medicine Prediction Agent forecasts ${p.medicine_name} shortage in ${p.days_remaining} day(s).`,
        String(p.medicine_id), p.confidence_score,
      ]
    );
  }
  return out;
}
