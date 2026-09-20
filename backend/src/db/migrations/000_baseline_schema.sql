-- ============================================================================
-- 000_baseline_schema.sql
-- Smart Hospital Management System — BASELINE SCHEMA (production-ready).
--
-- Creates the complete core schema required by the application so a FRESH
-- cloud MySQL database (no XAMPP, no SQL dump import) can be provisioned
-- with:  npm run db:migrate  &&  npm run db:seed
--
-- NON-DESTRUCTIVE BY DESIGN:
--   * CREATE TABLE IF NOT EXISTS — never drops or alters existing tables.
--   * Reference data is inserted only when the key is absent.
--   * blood_inventory and the obsolete roles (PHARMACIST, RECEPTIONIST,
--     LAB_STAFF) are intentionally NOT part of the baseline.
--   * Safe on an empty cloud DB and on the existing local XAMPP database
--     (everything already exists → no-ops).
--
-- Compatible with MySQL 8.0+ and MariaDB 10.4+. Uses utf8mb4_general_ci so
-- managed MySQL/MariaDB services (which may lack utf8mb4_0900_ai_ci) work.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─── Roles (final four login roles only) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  role_id int NOT NULL AUTO_INCREMENT,
  role_name varchar(50) NOT NULL,
  description varchar(255) DEFAULT NULL,
  PRIMARY KEY (role_id),
  UNIQUE KEY role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Users / authentication ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id int NOT NULL AUTO_INCREMENT,
  role_id int NOT NULL,
  full_name varchar(100) NOT NULL,
  email varchar(150) NOT NULL,
  password_hash varchar(255) NOT NULL,
  phone varchar(15) DEFAULT NULL,
  status enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY email (email),
  KEY fk_users_role (role_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Departments ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  department_id int NOT NULL AUTO_INCREMENT,
  department_name varchar(100) NOT NULL,
  description varchar(255) DEFAULT NULL,
  PRIMARY KEY (department_id),
  UNIQUE KEY department_name (department_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Doctors ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  doctor_id int NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  department_id int NOT NULL,
  specialization varchar(100) NOT NULL,
  license_number varchar(100) DEFAULT NULL,
  qualification varchar(150) DEFAULT NULL,
  experience_years int DEFAULT '0',
  consultation_fee decimal(10,2) DEFAULT '0.00',
  availability_status enum('AVAILABLE','UNAVAILABLE') DEFAULT 'AVAILABLE',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (doctor_id),
  UNIQUE KEY user_id (user_id),
  UNIQUE KEY license_number (license_number),
  KEY fk_doctors_department (department_id),
  CONSTRAINT fk_doctors_department FOREIGN KEY (department_id) REFERENCES departments (department_id),
  CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT chk_consultation_fee CHECK (consultation_fee >= 0),
  CONSTRAINT chk_doctor_experience CHECK (experience_years >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Patients ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  patient_id int NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  date_of_birth date DEFAULT NULL,
  gender varchar(20) DEFAULT NULL,
  blood_group varchar(5) DEFAULT NULL,
  address varchar(255) DEFAULT NULL,
  emergency_contact_name varchar(100) DEFAULT NULL,
  emergency_contact_phone varchar(15) DEFAULT NULL,
  PRIMARY KEY (patient_id),
  KEY user_id (user_id),
  CONSTRAINT patients_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Wards & beds ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wards (
  ward_id int NOT NULL AUTO_INCREMENT,
  ward_name varchar(100) NOT NULL,
  ward_type varchar(50) DEFAULT NULL,
  floor int DEFAULT NULL,
  PRIMARY KEY (ward_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS beds (
  bed_id int NOT NULL AUTO_INCREMENT,
  ward_id int NOT NULL,
  bed_number varchar(20) NOT NULL,
  bed_type varchar(50) DEFAULT NULL,
  status enum('AVAILABLE','OCCUPIED','RESERVED','MAINTENANCE') DEFAULT 'AVAILABLE',
  PRIMARY KEY (bed_id),
  UNIQUE KEY uq_ward_bed (ward_id, bed_number),
  CONSTRAINT fk_beds_ward FOREIGN KEY (ward_id) REFERENCES wards (ward_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Appointments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id int NOT NULL AUTO_INCREMENT,
  patient_id int NOT NULL,
  doctor_id int NOT NULL,
  department_id int NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  reason varchar(255) DEFAULT NULL,
  status enum('PENDING','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW') DEFAULT 'PENDING',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (appointment_id),
  KEY fk_appointments_department (department_id),
  KEY idx_appointment_patient (patient_id),
  KEY idx_appointment_doctor (doctor_id),
  KEY idx_appointment_date (appointment_date),
  CONSTRAINT fk_appointments_department FOREIGN KEY (department_id) REFERENCES departments (department_id),
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id),
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Emergency cases (also the ICU admission record via assigned_bed_id) ───
CREATE TABLE IF NOT EXISTS emergency_cases (
  emergency_id int NOT NULL AUTO_INCREMENT,
  patient_id int NOT NULL,
  assigned_doctor_id int DEFAULT NULL,
  assigned_bed_id int DEFAULT NULL,
  arrival_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  priority enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  condition_description text,
  status enum('OPEN','IN_TREATMENT','STABLE','DISCHARGED') DEFAULT 'OPEN',
  PRIMARY KEY (emergency_id),
  KEY fk_emergency_patient (patient_id),
  KEY fk_emergency_doctor (assigned_doctor_id),
  KEY fk_emergency_bed (assigned_bed_id),
  CONSTRAINT fk_emergency_bed FOREIGN KEY (assigned_bed_id) REFERENCES beds (bed_id),
  CONSTRAINT fk_emergency_doctor FOREIGN KEY (assigned_doctor_id) REFERENCES doctors (doctor_id),
  CONSTRAINT fk_emergency_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Billing ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  bill_id int NOT NULL AUTO_INCREMENT,
  patient_id int NOT NULL,
  bill_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal decimal(10,2) NOT NULL DEFAULT '0.00',
  discount decimal(10,2) NOT NULL DEFAULT '0.00',
  tax decimal(10,2) NOT NULL DEFAULT '0.00',
  total_amount decimal(10,2) NOT NULL DEFAULT '0.00',
  payment_status enum('PENDING','PARTIAL','PAID','CANCELLED') DEFAULT 'PENDING',
  PRIMARY KEY (bill_id),
  KEY fk_bills_patient (patient_id),
  CONSTRAINT fk_bills_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id),
  CONSTRAINT chk_bill_amounts CHECK (subtotal >= 0 AND discount >= 0 AND tax >= 0 AND total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS bill_items (
  bill_item_id int NOT NULL AUTO_INCREMENT,
  bill_id int NOT NULL,
  item_type varchar(50) NOT NULL,
  description varchar(255) DEFAULT NULL,
  quantity int DEFAULT '1',
  unit_price decimal(10,2) DEFAULT '0.00',
  amount decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (bill_item_id),
  KEY fk_bill_items_bill (bill_id),
  CONSTRAINT fk_bill_items_bill FOREIGN KEY (bill_id) REFERENCES bills (bill_id),
  CONSTRAINT chk_bill_item_price CHECK (unit_price >= 0),
  CONSTRAINT chk_bill_item_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS payments (
  payment_id int NOT NULL AUTO_INCREMENT,
  bill_id int NOT NULL,
  amount decimal(10,2) NOT NULL,
  payment_method enum('CASH','CARD','UPI','ONLINE') NOT NULL,
  payment_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  transaction_reference varchar(100) DEFAULT NULL,
  status enum('SUCCESS','PENDING','FAILED') DEFAULT 'SUCCESS',
  PRIMARY KEY (payment_id),
  KEY fk_payments_bill (bill_id),
  CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id) REFERENCES bills (bill_id),
  CONSTRAINT chk_payment_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Clinical records ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_records (
  record_id int NOT NULL AUTO_INCREMENT,
  patient_id int NOT NULL,
  doctor_id int NOT NULL,
  appointment_id int DEFAULT NULL,
  diagnosis text,
  symptoms text,
  treatment text,
  notes text,
  record_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY fk_records_patient (patient_id),
  KEY fk_records_doctor (doctor_id),
  KEY fk_records_appointment (appointment_id),
  CONSTRAINT fk_records_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id),
  CONSTRAINT fk_records_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id),
  CONSTRAINT fk_records_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS prescriptions (
  prescription_id int NOT NULL AUTO_INCREMENT,
  patient_id int NOT NULL,
  doctor_id int NOT NULL,
  appointment_id int DEFAULT NULL,
  prescription_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  instructions text,
  PRIMARY KEY (prescription_id),
  KEY fk_prescription_patient (patient_id),
  KEY fk_prescription_doctor (doctor_id),
  KEY fk_prescription_appointment (appointment_id),
  CONSTRAINT fk_prescription_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id),
  CONSTRAINT fk_prescription_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id),
  CONSTRAINT fk_prescription_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS prescription_items (
  prescription_item_id int NOT NULL AUTO_INCREMENT,
  prescription_id int NOT NULL,
  medicine_id int NOT NULL,
  dosage varchar(100) DEFAULT NULL,
  frequency varchar(100) DEFAULT NULL,
  duration varchar(100) DEFAULT NULL,
  instructions varchar(255) DEFAULT NULL,
  PRIMARY KEY (prescription_item_id),
  KEY fk_prescription_items_prescription (prescription_id),
  KEY fk_prescription_items_medicine (medicine_id),
  CONSTRAINT fk_prescription_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (medicine_id),
  CONSTRAINT fk_prescription_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions (prescription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS lab_reports (
  report_id int NOT NULL AUTO_INCREMENT,
  patient_id int NOT NULL,
  doctor_id int DEFAULT NULL,
  appointment_id int DEFAULT NULL,
  test_name varchar(150) NOT NULL,
  test_date date NOT NULL,
  result text,
  status enum('PENDING','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  remarks text,
  PRIMARY KEY (report_id),
  KEY fk_lab_patient (patient_id),
  KEY fk_lab_doctor (doctor_id),
  KEY fk_lab_appointment (appointment_id),
  CONSTRAINT fk_lab_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id),
  CONSTRAINT fk_lab_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id),
  CONSTRAINT fk_lab_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Pharmacy / inventory / equipment ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicines (
  medicine_id int NOT NULL AUTO_INCREMENT,
  medicine_name varchar(150) NOT NULL,
  category varchar(100) DEFAULT NULL,
  quantity int NOT NULL DEFAULT '0',
  unit_price decimal(10,2) NOT NULL DEFAULT '0.00',
  expiry_date date DEFAULT NULL,
  reorder_level int DEFAULT '10',
  supplier varchar(150) DEFAULT NULL,
  status enum('AVAILABLE','OUT_OF_STOCK','EXPIRED') DEFAULT 'AVAILABLE',
  PRIMARY KEY (medicine_id),
  CONSTRAINT chk_medicine_price CHECK (unit_price >= 0),
  CONSTRAINT chk_medicine_quantity CHECK (quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS equipment (
  equipment_id int NOT NULL AUTO_INCREMENT,
  equipment_name varchar(150) NOT NULL,
  department_id int DEFAULT NULL,
  quantity int NOT NULL DEFAULT '1',
  equipment_condition varchar(50) DEFAULT NULL,
  status enum('AVAILABLE','IN_USE','MAINTENANCE') DEFAULT 'AVAILABLE',
  last_maintenance_date date DEFAULT NULL,
  next_maintenance_date date DEFAULT NULL,
  PRIMARY KEY (equipment_id),
  KEY fk_equipment_department (department_id),
  CONSTRAINT fk_equipment_department FOREIGN KEY (department_id) REFERENCES departments (department_id),
  CONSTRAINT chk_equipment_quantity CHECK (quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Doctor availability ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_availability (
  availability_id int NOT NULL AUTO_INCREMENT,
  doctor_id int NOT NULL,
  day_of_week enum('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY') NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  PRIMARY KEY (availability_id),
  KEY fk_availability_doctor (doctor_id),
  CONSTRAINT fk_availability_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id),
  CONSTRAINT chk_availability_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- Reference data (hospital setup — inserted only when absent)
-- ============================================================================

-- The four FINAL login roles. Obsolete roles (PHARMACIST, RECEPTIONIST,
-- LAB_STAFF) are deliberately absent — migration 003 removes them from
-- databases that predate the baseline.
INSERT IGNORE INTO roles (role_id, role_name, description) VALUES
  (1, 'ADMIN',   'Hospital Administrator'),
  (2, 'DOCTOR',  'Medical Doctor'),
  (3, 'NURSE',   'Nursing Staff'),
  (4, 'PATIENT', 'Hospital Patient');

INSERT IGNORE INTO departments (department_id, department_name, description) VALUES
  (1, 'Cardiology',       'Heart and cardiovascular care'),
  (2, 'Neurology',        'Brain and nervous system care'),
  (3, 'Orthopedics',      'Bones, joints and muscles'),
  (4, 'Pediatrics',       'Medical care for children'),
  (5, 'General Medicine', 'General medical treatment'),
  (6, 'Dermatology',      'Skin related treatment'),
  (7, 'Gynecology',       'Women health and reproductive care'),
  (8, 'ENT',              'Ear, Nose and Throat'),
  (9, 'Emergency',        'Emergency medical services');

INSERT IGNORE INTO wards (ward_id, ward_name, ward_type, floor) VALUES
  (1, 'General Ward A',  'GENERAL',   1),
  (2, 'ICU Ward',        'ICU',       2),
  (3, 'Private Ward A',  'PRIVATE',   1),
  (4, 'Emergency Ward',  'EMERGENCY', 0);

INSERT IGNORE INTO beds (bed_id, ward_id, bed_number, bed_type, status) VALUES
  (1, 1, 'G-101', 'GENERAL', 'AVAILABLE'),
  (2, 1, 'G-102', 'GENERAL', 'AVAILABLE'),
  (3, 2, 'ICU-01', 'ICU',    'AVAILABLE'),
  (4, 2, 'ICU-02', 'ICU',    'AVAILABLE'),
  (5, 3, 'P-101', 'PRIVATE', 'AVAILABLE');

INSERT INTO medicines (medicine_name, category, quantity, unit_price, expiry_date, reorder_level, supplier, status)
SELECT * FROM (
  SELECT 'Paracetamol 500mg' AS medicine_name, 'Tablet' AS category, 500 AS quantity, 2.00 AS unit_price, '2027-06-30' AS expiry_date, 50 AS reorder_level, 'ABC Pharma' AS supplier, 'AVAILABLE' AS status
  UNION ALL SELECT 'Amoxicillin 500mg', 'Antibiotic', 200, 8.00, '2027-03-31', 30, 'XYZ Pharma', 'AVAILABLE'
  UNION ALL SELECT 'Cetirizine 10mg',   'Tablet',    300, 3.00, '2027-08-31', 40, 'MediCare Ltd', 'AVAILABLE'
) base
WHERE NOT EXISTS (SELECT 1 FROM medicines m WHERE m.medicine_name = base.medicine_name);

SET FOREIGN_KEY_CHECKS = 1;
