import { databasePath, query } from '../config/database';

async function main() {
  const checks = await Promise.all([
    query('SELECT COUNT(*) AS count FROM roles'),
    query('SELECT COUNT(*) AS count FROM users'),
    query('SELECT COUNT(*) AS count FROM doctors'),
    query('SELECT COUNT(*) AS count FROM patients'),
    query('SELECT COUNT(*) AS count FROM appointments'),
    query('SELECT COUNT(*) AS count FROM emergency_cases'),
    query('SELECT COUNT(*) AS count FROM ai_agent_logs'),
  ]);
  console.log(`Active SQLite database: ${databasePath}`);
  console.log(JSON.stringify({
    roles: checks[0][0].count,
    users: checks[1][0].count,
    doctors: checks[2][0].count,
    patients: checks[3][0].count,
    appointments: checks[4][0].count,
    emergency_cases: checks[5][0].count,
    agent_logs: checks[6][0].count,
  }, null, 2));
}

main().catch((error) => {
  console.error('Validation failed:', (error as Error).message);
  process.exit(1);
});
