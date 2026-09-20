import express from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import authRoutes from './routes/authRoutes';
import coreRoutes from './routes/coreRoutes';
import emergencyRoutes from './routes/emergencyRoutes';
import aiRoutes from './routes/aiRoutes';
import { pingDatabase } from './config/database';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

const app = express();

/**
 * CORS — environment-driven, never a permanent wildcard.
 *
 * Development: the Vite dev server origins (localhost:5173) are always
 * allowed, so the local Vite setup works unchanged.
 * Production: set FRONTEND_URL on the backend host to the deployed
 * frontend origin (scheme + host, no trailing slash), e.g.
 *   FRONTEND_URL=https://smart-hospital-frontend.example.com
 * Multiple origins may be given comma-separated. When FRONTEND_URL is set,
 * localhost origins stay allowed too (handy for smoke-testing a deployed
 * backend from a dev machine) — remove localhost from FRONTEND_URL logic
 * here if that is not desired.
 */
const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://smart-hospital-management-system-git-main-innov-ai-tors.vercel.app',
    ...(process.env.FRONTEND_URL || '')
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  ]
);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow same-origin/non-browser tools (curl, health checks) which send
    // no Origin header; browsers always send one on cross-origin calls.
    const normalizedOrigin = origin?.replace(/\/+$/, '');
    if (!origin || (normalizedOrigin && allowedOrigins.has(normalizedOrigin))) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// ─── Health check (backend + database) ─────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pingDatabase();
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'disconnected', error: (err as Error).message });
  }
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', coreRoutes);
app.use('/api', emergencyRoutes);
app.use('/api', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
