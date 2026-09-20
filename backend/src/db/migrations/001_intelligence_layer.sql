-- ============================================================================
-- 001_intelligence_layer.sql
-- Smart Hospital Management System — AI / Decision-Support Layer
--
-- NON-DESTRUCTIVE: extends the existing smart_hospital_db schema (users,
-- roles, patients, doctors, appointments, emergency_cases, wards, beds,
-- medicines, prescriptions, medical_records, lab_reports,
-- doctor_availability, equipment, bills, bill_items, payments).
-- No existing table is dropped or redesigned. Safe to run repeatedly.
-- Compatible with MySQL 8.0+ and MariaDB 10.4+.
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- A. AI EMERGENCY TRIAGE — assessment records linked to emergency_cases
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS triage_assessments (
  triage_id            INT NOT NULL AUTO_INCREMENT,
  emergency_id         INT NOT NULL,
  patient_id           INT NOT NULL,
  symptoms             TEXT,
  condition_description TEXT,
  vital_signs          JSON,          -- {"bp":"120/80","hr":88,"spo2":97,"temp":37.0,"rr":16}
  priority             ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  risk_score           TINYINT UNSIGNED NOT NULL,           -- 0-100
  confidence_score     TINYINT UNSIGNED NOT NULL,           -- 0-100
  recommended_action   VARCHAR(255),
  ai_reasoning         TEXT,
  human_review_status  ENUM('PENDING','APPROVED','REJECTED','MODIFIED') NOT NULL DEFAULT 'PENDING',
  reviewed_by          INT NULL,
  reviewed_at          TIMESTAMP NULL,
  created_at           TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (triage_id),
  KEY idx_triage_emergency (emergency_id),
  KEY idx_triage_patient (patient_id),
  KEY idx_triage_priority (priority),
  KEY idx_triage_review (human_review_status),
  CONSTRAINT fk_triage_emergency FOREIGN KEY (emergency_id) REFERENCES emergency_cases (emergency_id),
  CONSTRAINT fk_triage_patient  FOREIGN KEY (patient_id)  REFERENCES patients (patient_id),
  CONSTRAINT fk_triage_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (user_id),
  CONSTRAINT chk_triage_score   CHECK (risk_score BETWEEN 0 AND 100 AND confidence_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- B. SMART BED ALLOCATION — recommendation + reservation history for beds
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bed_allocations (
  allocation_id     INT NOT NULL AUTO_INCREMENT,
  bed_id            INT NOT NULL,
  patient_id        INT NOT NULL,
  emergency_id      INT NULL,
  bed_type          VARCHAR(50),
  priority          ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  match_score       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  confidence_score  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  reason            TEXT,
  factors           JSON,             -- ["ICU bed matched for critical patient", ...]
  status            ENUM('RECOMMENDED','RESERVED','CONFIRMED','RELEASED','CANCELLED') NOT NULL DEFAULT 'RECOMMENDED',
  human_review_status ENUM('PENDING','APPROVED','REJECTED','MODIFIED') NOT NULL DEFAULT 'PENDING',
  reviewed_by       INT NULL,
  created_at        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  released_at       TIMESTAMP NULL,
  PRIMARY KEY (allocation_id),
  KEY idx_balloc_bed (bed_id),
  KEY idx_balloc_patient (patient_id),
  KEY idx_balloc_emergency (emergency_id),
  KEY idx_balloc_status (status),
  CONSTRAINT fk_balloc_bed      FOREIGN KEY (bed_id)       REFERENCES beds (bed_id),
  CONSTRAINT fk_balloc_patient  FOREIGN KEY (patient_id)   REFERENCES patients (patient_id),
  CONSTRAINT fk_balloc_emergency FOREIGN KEY (emergency_id) REFERENCES emergency_cases (emergency_id),
  CONSTRAINT fk_balloc_reviewer FOREIGN KEY (reviewed_by)  REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- C. DOCTOR WORKLOAD — computed snapshot per doctor per day
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_workload (
  workload_id        INT NOT NULL AUTO_INCREMENT,
  doctor_id          INT NOT NULL,
  workload_date      DATE NOT NULL,
  active_appointments INT NOT NULL DEFAULT 0,
  emergency_cases    INT NOT NULL DEFAULT 0,
  total_patients     INT NOT NULL DEFAULT 0,
  workload_score     TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- 0-100
  availability_status ENUM('AVAILABLE','BUSY','OVERLOADED') NOT NULL DEFAULT 'AVAILABLE',
  suggested_for_emergency TINYINT(1) NOT NULL DEFAULT 1,
  computed_at        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workload_id),
  UNIQUE KEY uq_doctor_day (doctor_id, workload_date),
  CONSTRAINT fk_dworkload_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id),
  CONSTRAINT chk_dworkload_score CHECK (workload_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- D. MEDICINE SHORTAGE PREDICTION — per medicine forecast
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicine_predictions (
  prediction_id        INT NOT NULL AUTO_INCREMENT,
  medicine_id          INT NOT NULL,
  current_quantity     INT NOT NULL DEFAULT 0,
  estimated_daily_usage INT NOT NULL DEFAULT 0,
  days_remaining       INT NOT NULL DEFAULT 0,        -- stock / daily usage
  shortage_risk        ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
  predicted_shortage_date DATE NULL,
  expiry_risk          TINYINT(1) NOT NULL DEFAULT 0,
  recommended_reorder_quantity INT NOT NULL DEFAULT 0,
  confidence_score     TINYINT UNSIGNED NOT NULL DEFAULT 50,
  recommendation       VARCHAR(255),
  created_at           TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (prediction_id),
  KEY idx_mp_medicine (medicine_id),
  KEY idx_mp_risk (shortage_risk),
  CONSTRAINT fk_mp_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (medicine_id),
  CONSTRAINT chk_mp_confidence CHECK (confidence_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- F. AI AGENT ACTIVITY / DECISION LOGS — powers the AgentFeed
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  log_id        BIGINT NOT NULL AUTO_INCREMENT,
  agent_id      VARCHAR(50) NOT NULL,     -- triage | bed | doctor | medicine | crisis | orchestrator | ambulance | followup
  agent_name    VARCHAR(100) NOT NULL,
  event_type    ENUM('info','alert','critical','success') NOT NULL DEFAULT 'info',
  message       TEXT NOT NULL,
  reference_type VARCHAR(50) NULL,        -- emergency_case | appointment | bed | medicine | simulation
  reference_id  VARCHAR(50) NULL,
  confidence_score TINYINT UNSIGNED NULL,
  created_by    INT NULL,                 -- user who triggered the action (if any)
  created_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_aal_agent (agent_id),
  KEY idx_aal_created (created_at),
  KEY idx_aal_ref (reference_type, reference_id),
  CONSTRAINT fk_aal_user FOREIGN KEY (created_by) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- G. DIGITAL TWIN / WHAT-IF CRISIS SIMULATION
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simulations (
  simulation_id   INT NOT NULL AUTO_INCREMENT,
  scenario_name   VARCHAR(150) NOT NULL,
  scenario_key    VARCHAR(50) NOT NULL,     -- ROAD_ACCIDENT | ICU_CAPACITY_LOSS | DOCTOR_SHORTAGE | ...
  parameters      JSON,                      -- {"patients":20,"windowMinutes":30}
  ran_by          INT NULL,
  created_at      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (simulation_id),
  KEY idx_sim_key (scenario_key),
  KEY idx_sim_created (created_at),
  CONSTRAINT fk_sim_user FOREIGN KEY (ran_by) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS simulation_results (
  result_id          INT NOT NULL AUTO_INCREMENT,
  simulation_id      INT NOT NULL,
  bed_demand         INT NOT NULL DEFAULT 0,
  icu_demand         INT NOT NULL DEFAULT 0,
  doctor_workload_delta INT NOT NULL DEFAULT 0,
  medicine_demand_units INT NOT NULL DEFAULT 0,
  ambulances_required INT NOT NULL DEFAULT 0,
  capacity_risk      ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
  predicted_state    JSON,                    -- full predicted state snapshot
  recommendations    JSON,                    -- agent action plan items
  created_at         TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (result_id),
  KEY idx_sres_sim (simulation_id),
  CONSTRAINT fk_sres_sim FOREIGN KEY (simulation_id) REFERENCES simulations (simulation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- H. OUTCOME / FOLLOW-UP VERIFICATION — closes the AI workflow loop
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outcome_verifications (
  outcome_id       INT NOT NULL AUTO_INCREMENT,
  emergency_id     INT NULL,
  appointment_id   INT NULL,
  patient_id       INT NOT NULL,
  outcome          ENUM('RECOVERED','IMPROVING','STABLE','WORSENING','DECEASED','TRANSFERRED') NOT NULL DEFAULT 'STABLE',
  status           ENUM('OPEN','MONITORING','ON_TRACK','MISSED_APPOINTMENT','REVIEW_REQUIRED','CLOSED') NOT NULL DEFAULT 'OPEN',
  follow_up_date   DATE NULL,
  verification     VARCHAR(255),
  notes            TEXT,
  reviewer_id      INT NULL,
  verified_at      TIMESTAMP NULL,
  created_at       TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (outcome_id),
  KEY idx_ov_patient (patient_id),
  KEY idx_ov_emergency (emergency_id),
  KEY idx_ov_appointment (appointment_id),
  KEY idx_ov_status (status),
  CONSTRAINT fk_ov_emergency   FOREIGN KEY (emergency_id)   REFERENCES emergency_cases (emergency_id),
  CONSTRAINT fk_ov_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id),
  CONSTRAINT fk_ov_patient     FOREIGN KEY (patient_id)     REFERENCES patients (patient_id),
  CONSTRAINT fk_ov_reviewer    FOREIGN KEY (reviewer_id)    REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
