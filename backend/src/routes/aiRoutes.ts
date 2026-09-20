import { Router, json } from 'express';
import { query, execute, pingDatabase } from '../config/database';
import { authenticate, requireRole } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { predictMedicineDemand } from '../agents/predictionAgents';
import { runSimulation, listScenarios, recentSimulations } from '../agents/simulationAgent';

const router = Router();
router.use(json());

// ─── Medicine shortage prediction ───────────────────────────────────────────
router.get('/ai/medicine-prediction', authenticate, requireRole(
  'ADMIN', 'DOCTOR', 'NURSE'
), async (_req, res, next) => {
  try {
    const predictions = await predictMedicineDemand();
    res.json({ predictions });
  } catch (err) { next(err); }
});

// ─── Agent activity logs — powers the AgentFeed ────────────────────────────
router.get('/ai/agents', authenticate, async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const rows = await query(
      `SELECT log_id, agent_id, agent_name, event_type, message, reference_type, reference_id, confidence_score, created_at
       FROM ai_agent_logs ORDER BY created_at DESC, log_id DESC LIMIT ${limit}`
    );
    res.json({ events: rows });
  } catch (err) { next(err); }
});

/** Post a custom agent event (e.g. orchestrator notifications from the UI). */
router.post('/ai/agents', authenticate, async (req, res, next) => {
  try {
    const { agent_id, agent_name, event_type, message, reference_type, reference_id, confidence_score } = req.body || {};
    if (!agent_id || !agent_name || !message) throw new HttpError(400, 'agent_id, agent_name and message are required');
    const ins = await execute(
      `INSERT INTO ai_agent_logs (agent_id, agent_name, event_type, message, reference_type, reference_id, confidence_score, created_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [agent_id, agent_name, event_type || 'info', message, reference_type ?? null, reference_id ?? null, confidence_score ?? null, req.user!.user_id]
    );
    res.status(201).json({ log_id: ins.insertId });
  } catch (err) { next(err); }
});

// ─── Crisis simulations (digital twin) ─────────────────────────────────────
router.get('/ai/simulations/scenarios', authenticate, async (_req, res, next) => {
  try {
    res.json({ scenarios: listScenarios() });
  } catch (err) { next(err); }
});

router.post('/ai/simulations', authenticate, requireRole('ADMIN', 'DOCTOR', 'NURSE'), async (req, res, next) => {
  try {
    const { scenario_key, parameters } = req.body || {};
    if (!scenario_key) throw new HttpError(400, 'scenario_key is required');
    const result = await runSimulation(scenario_key, parameters || {}, req.user!.user_id);
    res.status(201).json({ simulation: result });
  } catch (err) { next(err); }
});

router.get('/ai/simulations', authenticate, requireRole('ADMIN', 'DOCTOR', 'NURSE'), async (_req, res, next) => {
  try {
    res.json({ simulations: await recentSimulations(10) });
  } catch (err) { next(err); }
});

export default router;
