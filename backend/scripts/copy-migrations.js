/**
 * Copies non-TS runtime assets into the compiled build output so the
 * production backend is self-contained:
 *
 *   dist/db/sqlite-migrations/*.sql   ← backend/src/db/sqlite-migrations/*.sql
 *   dist/.env.example          ← backend/.env.example (reference only)
 *
 * `tsc` only compiles .ts files, so without this the production migration
 * command (node dist/db/migrate.js) would not find its SQL files.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcMigrations = path.join(root, 'src', 'db', 'sqlite-migrations');
const outMigrations = path.join(root, 'dist', 'db', 'sqlite-migrations');

fs.mkdirSync(outMigrations, { recursive: true });
for (const f of fs.readdirSync(srcMigrations)) {
  if (f.endsWith('.sql')) {
    fs.copyFileSync(path.join(srcMigrations, f), path.join(outMigrations, f));
    console.log(`  ✓ dist/db/sqlite-migrations/${f}`);
  }
}

const envExample = path.join(root, '.env.example');
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(root, 'dist', '.env.example'));
  console.log('  ✓ dist/.env.example');
}
console.log('✓ Runtime assets copied into dist/');
