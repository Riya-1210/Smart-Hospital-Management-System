import app from './app';
import { config } from './config';
import { pingDatabase, databaseProvider } from './config/database';

const isServerlessRuntime = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

async function start() {
  try {
    await pingDatabase();
    console.log(`✓ Database connection verified (${databaseProvider})`);
  } catch (err) {
    console.error('✗ Database connection FAILED:', (err as Error).message);
    console.error('  Check backend/.env and run npm run db:migrate --prefix backend');
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`✓ Smart Hospital backend listening on http://0.0.0.0:${config.port}`);
    console.log(`  Health check: http://localhost:${config.port}/api/health`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`✗ EADDRINUSE: port ${config.port} is already in use.`);
      console.error('  Identify the stale backend process or change PORT in backend/.env to a free port.');
      process.exit(1);
    }
    console.error('✗ Server error:', err.message);
    process.exit(1);
  });
}

if (!isServerlessRuntime) {
  start();
}

export default app;
