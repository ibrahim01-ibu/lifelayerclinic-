-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  clinic_type VARCHAR(50), 
  established_year INTEGER,
  specialties TEXT[], 
  logo_url VARCHAR(500),
  license_document_url VARCHAR(500),
  billing_email VARCHAR(255),
  billing_phone VARCHAR(20),
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_plan VARCHAR(50) DEFAULT 'professional',
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  max_users INTEGER DEFAULT 5,
  max_patients INTEGER DEFAULT 5000,
  storage_limit_gb INTEGER DEFAULT 100,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinics_license ON clinics(license_number);
CREATE INDEX IF NOT EXISTS idx_clinics_city ON clinics(city);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'doctor', 'receptionist', 'manager'
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- ============================================================================
-- DOCTORS & STAFF
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  user_id UUID NOT NULL REFERENCES users(id),
  registration_number VARCHAR(100) NOT NULL,
  registration_council VARCHAR(100),
  specializations TEXT[],
  qualifications TEXT[],
  experience_years INTEGER,
  consultation_fee_default DECIMAL(10, 2) DEFAULT 500,
  consultation_duration_minutes INTEGER DEFAULT 15,
  bio TEXT,
  profile_picture_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  availability_schedule JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_registration ON doctors(registration_number);

-- ============================================================================
-- PATIENTS & HEALTH RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_mrn VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  blood_group VARCHAR(5),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(patient_mrn);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients(date_of_birth);

CREATE TABLE IF NOT EXISTS patient_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  condition_name VARCHAR(255) NOT NULL,
  icd_10_code VARCHAR(10),
  diagnosis_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  severity VARCHAR(50), 
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_conditions_patient_id ON patient_conditions(patient_id);

CREATE TABLE IF NOT EXISTS patient_allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  allergen_name VARCHAR(255) NOT NULL,
  reaction_type VARCHAR(255),
  severity VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient_id ON patient_allergies(patient_id);

-- ============================================================================
-- APPOINTMENTS & CONSULTATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_datetime TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 15,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'checked_in', 'completed', 'cancelled', 'no_show'
  appointment_type VARCHAR(50),
  reason_for_visit TEXT,
  notes TEXT,
  checked_in_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason VARCHAR(255),
  is_reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  past_medical_history TEXT,
  physical_examination TEXT,
  assessment TEXT,
  plan TEXT,
  vitals JSONB, 
  doctor_notes TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON consultations(appointment_id);

-- ============================================================================
-- PRESCRIPTIONS & MEDICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  consultation_id UUID NOT NULL REFERENCES consultations(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  prescription_date DATE NOT NULL,
  prescription_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  expiry_date DATE,
  notes TEXT,
  instructions TEXT,
  pdf_url VARCHAR(500),
  qr_code_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);

CREATE TABLE IF NOT EXISTS prescription_medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id),
  drug_name VARCHAR(255) NOT NULL,
  drug_generic_name VARCHAR(255),
  drug_id_rxnorm VARCHAR(50),
  strength VARCHAR(100),
  form VARCHAR(50),
  quantity INTEGER,
  unit VARCHAR(20) DEFAULT 'tablet',
  frequency VARCHAR(100),
  duration_days INTEGER,
  route VARCHAR(50),
  special_instructions TEXT, 
  contraindications TEXT,
  side_effects TEXT,
  refills_allowed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescription_medicines_prescription_id ON prescription_medicines(prescription_id);

-- ============================================================================
-- LAB TESTS & REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  consultation_id UUID NOT NULL REFERENCES consultations(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  test_name VARCHAR(255) NOT NULL,
  test_category VARCHAR(100),
  test_date DATE,
  status VARCHAR(50) DEFAULT 'ordered', 
  external_lab_name VARCHAR(255),
  result_document_url VARCHAR(500),
  result_summary JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_tests_patient_id ON lab_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_consultation_id ON lab_tests(consultation_id);

-- ============================================================================
-- DISCHARGE SUMMARIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS discharge_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  admission_date DATE NOT NULL,
  discharge_date DATE NOT NULL,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment_given TEXT,
  condition_at_discharge VARCHAR(255), 
  medications_prescribed JSONB, 
  follow_up_instructions TEXT,
  follow_up_date DATE,
  follow_up_doctor_id UUID REFERENCES doctors(id),
  pdf_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discharge_summaries_patient_id ON discharge_summaries(patient_id);

-- ============================================================================
-- LIFECARDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifecards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  card_number VARCHAR(50) UNIQUE NOT NULL,
  card_status VARCHAR(50) DEFAULT 'active',
  issue_date DATE NOT NULL,
  expiry_date DATE,
  card_type VARCHAR(50) DEFAULT 'digital', 
  qr_code_data JSONB,
  nfc_serial_number VARCHAR(100),
  emergency_snapshot JSONB,
  last_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifecards_patient_id ON lifecards(patient_id);
CREATE INDEX IF NOT EXISTS idx_lifecards_card_number ON lifecards(card_number);

CREATE TABLE IF NOT EXISTS lifecard_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lifecard_id UUID NOT NULL REFERENCES lifecards(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  scanned_by_user_id UUID NOT NULL REFERENCES users(id),
  scan_timestamp TIMESTAMP DEFAULT NOW(),
  scan_location VARCHAR(255),
  ip_address VARCHAR(45),
  device_info VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_lifecard_scans_lifecard_id ON lifecard_scans(lifecard_id);

-- ============================================================================
-- INVOICING & BILLING
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'unpaid',
  total_amount DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2),
  discount_amount DECIMAL(12, 2),
  net_amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  payment_date TIMESTAMP,
  transaction_id VARCHAR(100),
  notes TEXT,
  pdf_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_clinic_id ON invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  item_description VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================================================
-- AUDIT & SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  user_id UUID REFERENCES users(id),
  action_type VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  device_info VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL UNIQUE REFERENCES clinics(id),
  consultation_fee_default DECIMAL(10, 2) DEFAULT 500,
  follow_up_fee DECIMAL(10, 2) DEFAULT 300,
  appointment_reminder_enabled BOOLEAN DEFAULT true,
  reminder_time_minutes INTEGER DEFAULT 30,
  auto_invoice_generation BOOLEAN DEFAULT true,
  tax_rate DECIMAL(5, 2) DEFAULT 18,
  date_format VARCHAR(20) DEFAULT 'DD-MM-YYYY',
  time_format VARCHAR(20) DEFAULT '24h',
  currency VARCHAR(5) DEFAULT 'INR',
  language VARCHAR(10) DEFAULT 'en',
  clinic_hours_start TIME DEFAULT '09:00',
  clinic_hours_end TIME DEFAULT '18:00',
  break_time_start TIME,
  break_time_end TIME,
  working_days TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  queue_position INTEGER,
  check_in_time TIMESTAMP,
  calling_time TIMESTAMP,
  room_assigned VARCHAR(50),
  status VARCHAR(50) DEFAULT 'waiting', -- 'waiting', 'called', 'consulting', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_queue_clinic_id ON patient_queue(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_queue_doctor_id ON patient_queue(doctor_id);
