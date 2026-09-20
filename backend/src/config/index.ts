import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

export const config = {
  port: (() => {
    const raw = process.env.PORT;
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 4000;
  })(),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  demoPassword: process.env.DEMO_PASSWORD || 'demo123',
  frontendUrl: process.env.FRONTEND_URL || '',
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || '',
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
};
