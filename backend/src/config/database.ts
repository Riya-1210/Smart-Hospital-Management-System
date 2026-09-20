import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { createClient, type Client, type InArgs } from '@libsql/client';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const backendRoot = path.resolve(__dirname, '../..');
export const databaseProvider = process.env.TURSO_DATABASE_URL ? 'turso' : 'sqlite';

const databaseUrl = process.env.DATABASE_URL || 'file:./data/smart-hospital.db';
const relativePath = databaseUrl.replace(/^file:/, '');
export const databasePath = path.isAbsolute(relativePath)
  ? relativePath
  : path.resolve(backendRoot, relativePath);

function adaptSql(sql: string): string {
  return sql
    .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/CURDATE\(\)\s*\+\s*INTERVAL\s*\?\s*DAY/gi, "date('now', ? || ' days')")
    .replace(/DATE_ADD\(CURDATE\(\),\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "date('now', '+$1 days')")
    .replace(/TIMESTAMPDIFF\(YEAR,\s*([^,]+),\s*CURDATE\(\)\)/gi, "CAST((julianday('now') - julianday($1)) / 365.25 AS INTEGER)")
    .replace(/FIELD\(e\.priority,\s*'CRITICAL',\s*'HIGH',\s*'MEDIUM',\s*'LOW'\)/gi,
      "CASE e.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END")
    .replace(/ON DUPLICATE KEY UPDATE\s+active_appointments\s*=\s*VALUES\(active_appointments\),\s*emergency_cases\s*=\s*VALUES\(emergency_cases\),\s*total_patients\s*=\s*VALUES\(total_patients\),\s*workload_score\s*=\s*VALUES\(workload_score\),\s*availability_status\s*=\s*VALUES\(availability_status\),\s*suggested_for_emergency\s*=\s*VALUES\(suggested_for_emergency\),\s*computed_at\s*=\s*CURRENT_TIMESTAMP/gi,
      'ON CONFLICT(doctor_id, workload_date) DO UPDATE SET active_appointments=excluded.active_appointments, emergency_cases=excluded.emergency_cases, total_patients=excluded.total_patients, workload_score=excluded.workload_score, availability_status=excluded.availability_status, suggested_for_emergency=excluded.suggested_for_emergency, computed_at=CURRENT_TIMESTAMP');
}

function normalizeLibsqlArgs(params: unknown[]): InArgs {
  return params.map((value) => value === undefined ? null : value) as InArgs;
}

const sqliteDb = (() => {
  if (databaseProvider === 'turso') return null;
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new sqlite3.Database(databasePath);
  const ready = new Promise<void>((resolve, reject) => {
    db.run('PRAGMA foreign_keys = ON', (error) => error ? reject(error) : resolve());
  });

  return { db, ready };
})();

const libsqlClient: Client | null = (() => {
  if (databaseProvider !== 'turso') return null;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;
  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
})();

export async function query<T = any>(sql: string, params: unknown[] = []): Promise<T> {
  if (libsqlClient) {
    const result = await libsqlClient.execute({
      sql: adaptSql(sql),
      args: normalizeLibsqlArgs(params) as InArgs,
    });
    return result.rows as T;
  }

  if (!sqliteDb) {
    throw new Error('No database provider configured');
  }

  await sqliteDb.ready;
  return new Promise<T>((resolve, reject) => {
    sqliteDb.db.all(adaptSql(sql), params, (error, rows) => error ? reject(error) : resolve(rows as T));
  });
}

export async function execute(sql: string, params: unknown[] = []): Promise<{ insertId: number; affectedRows: number }> {
  if (libsqlClient) {
    const result = await libsqlClient.execute({
      sql: adaptSql(sql),
      args: normalizeLibsqlArgs(params) as InArgs,
    });
    const insertId = typeof result.lastInsertRowid === 'number' ? result.lastInsertRowid : Number(result.lastInsertRowid ?? 0);
    return { insertId, affectedRows: result.rowsAffected ?? 0 };
  }

  if (!sqliteDb) {
    throw new Error('No database provider configured');
  }

  await sqliteDb.ready;
  return new Promise((resolve, reject) => {
    sqliteDb.db.run(adaptSql(sql), params, function (error) {
      if (error) reject(error);
      else resolve({ insertId: this.lastID, affectedRows: this.changes });
    });
  });
}

export async function pingDatabase(): Promise<boolean> {
  await query('SELECT 1 AS connected');
  return true;
}
