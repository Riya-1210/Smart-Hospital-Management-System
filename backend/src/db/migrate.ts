import path from 'path';
import { readFileSync } from 'fs';
import { execute, query } from '../config/database';

/** Applies only the independent SQLite migrations; legacy MySQL files are preserved and ignored. */
export async function migrate() {
  console.log('-> Running SQLite migrations...');
  await execute('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP)');
  const rows = await query<Array<{ name: string }>>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));
  const migrations = ['000_standalone_schema.sql'];

  let ran = 0;
  for (const name of migrations) {
    if (applied.has(name)) {
      console.log(`  = ${name} (already applied)`);
      continue;
    }
    const file = path.join(__dirname, 'sqlite-migrations', name);
    const sql = readFileSync(file, 'utf8');
    for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) {
      await execute(statement);
    }
    await execute('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
    console.log(`  [ok] ${name}`);
    ran++;
  }
  console.log(`SQLite migrations complete (${ran} new).`);
}

if (require.main === module) {
  migrate().catch((error) => {
    console.error('SQLite migration failed:', (error as Error).message);
    process.exit(1);
  });
}
