-- ============================================================================
-- 003_role_data_cleanup.sql
-- Smart Hospital Management System — final role/data correction.
--
-- 1. Removes login roles that are NOT part of the final system
--    (PHARMACIST, RECEPTIONIST, LAB_STAFF) and their user accounts.
--    The four supported roles are: ADMIN, DOCTOR, NURSE, PATIENT.
-- 2. Removes synthetic walk-in patient accounts, junk trial records and
--    development-time demo clutter (the seed recreates a clean, realistic set).
-- 3. Expands the ICU ward with enough beds for a realistic demonstration.
--
-- Order matters: transactional rows are removed before the users/patients
-- they reference (FK constraints). Safe to run once via the migration runner.
-- ============================================================================

-- ─── A. Wipe development-time transactional demo data ──────────────────────
-- All of these are re-created cleanly by the seed. Wiping first avoids FK
-- blocks when removing walk-in patients/users below.
DELETE FROM triage_assessments;
DELETE FROM bed_allocations;
DELETE FROM outcome_verifications;
DELETE FROM emergency_cases;
DELETE FROM simulation_results;
DELETE FROM simulations;
-- Agent activity logs reference the wiped entities (reference_id is a plain
-- string with no FK, so prune them to avoid dangling entries).
DELETE FROM ai_agent_logs;

-- ─── B. Remove test appointment rows ───────────────────────────────────────
DELETE FROM appointments WHERE reason = 'Checkup test';

-- ─── C. Remove synthetic walk-in patients + their login-less users ─────────
DELETE FROM patients WHERE user_id IN (
  SELECT user_id FROM users WHERE email LIKE 'walkin.%@emergency.local'
);
DELETE FROM users WHERE email LIKE 'walkin.%@emergency.local';

-- ─── D. Remove obsolete role accounts and roles ────────────────────────────
-- The final system exposes only ADMIN, DOCTOR, NURSE, PATIENT logins.
DELETE FROM users WHERE role_id IN (
  SELECT role_id FROM roles WHERE role_name IN ('PHARMACIST', 'RECEPTIONIST', 'LAB_STAFF')
);
DELETE FROM roles WHERE role_name IN ('PHARMACIST', 'RECEPTIONIST', 'LAB_STAFF');

-- ─── E. Bed hygiene + ICU capacity ─────────────────────────────────────────
-- Release beds left RESERVED by wiped demo allocations.
UPDATE beds SET status = 'AVAILABLE' WHERE status = 'RESERVED';

-- The ICU ward (ward_id 2) has too few beds for a convincing demo. Add more.
INSERT INTO beds (ward_id, bed_number, bed_type, status)
SELECT 2, n.bed_number, 'ICU', 'AVAILABLE'
FROM (
  SELECT 'ICU-03' AS bed_number UNION SELECT 'ICU-04' UNION SELECT 'ICU-05'
  UNION SELECT 'ICU-06' UNION SELECT 'ICU-07' UNION SELECT 'ICU-08'
) AS n
WHERE NOT EXISTS (
  SELECT 1 FROM beds b WHERE b.ward_id = 2 AND b.bed_number = n.bed_number
);
