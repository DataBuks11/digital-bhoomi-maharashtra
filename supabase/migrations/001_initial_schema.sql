-- =========================================================================
-- Digital Bhoomi Maharashtra - PostgreSQL & Supabase Database Migration
-- Version: 1.0.0
-- Tables: profiles, land_parcels, ownership_records, survey_requests,
--         mutations, registrations, documents, qr_codes, notifications,
--         audit_logs, system_settings
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users or standalone mock)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SURVEYOR', 'VERIFICATION_OFFICER', 'CITIZEN')),
    department TEXT,
    phone TEXT,
    district TEXT DEFAULT 'Pune',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LAND PARCELS (Bhu-Abhilekh Core)
CREATE TABLE IF NOT EXISTS land_parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ulpin VARCHAR(32) UNIQUE NOT NULL, -- Unique Land Parcel Identification Number (Bhu-Aadhaar)
    district VARCHAR(100) NOT NULL,
    taluka VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    gat_number VARCHAR(50) NOT NULL,
    survey_number VARCHAR(50),
    sub_division VARCHAR(20) DEFAULT '1',
    total_area_sqm NUMERIC(12, 2) NOT NULL,
    area_hectare NUMERIC(8, 4) NOT NULL,
    area_are NUMERIC(8, 2) NOT NULL,
    pot_kharaba_sqm NUMERIC(10, 2) DEFAULT 0,
    land_type VARCHAR(50) NOT NULL CHECK (land_type IN ('AGRICULTURAL_JIRAYAT', 'AGRICULTURAL_BAGAYAT', 'NON_AGRICULTURAL_RESIDENTIAL', 'NON_AGRICULTURAL_COMMERCIAL', 'INDUSTRIAL', 'FOREST', 'GOVERNMENT_RESERVED')),
    tenure_type VARCHAR(50) NOT NULL DEFAULT 'BHOGVATA_CLASS_1' CHECK (tenure_type IN ('BHOGVATA_CLASS_1', 'BHOGVATA_CLASS_2', 'GOVERNMENT_LEASE', 'INAM_CLASS')),
    assessment_tax NUMERIC(10, 2) DEFAULT 120.00,
    status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED' CHECK (status IN ('DRAFT', 'PENDING_SURVEY', 'PENDING_VERIFICATION', 'VERIFIED', 'IN_DISPUTE', 'MUTATION_IN_PROGRESS', 'ARCHIVED')),
    coordinates_geojson JSONB,
    qr_code_hash VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_land_parcels_district_taluka ON land_parcels(district, taluka, village);
CREATE INDEX IF NOT EXISTS idx_land_parcels_gat ON land_parcels(gat_number);
CREATE INDEX IF NOT EXISTS idx_land_parcels_ulpin ON land_parcels(ulpin);

-- 3. OWNERSHIP RECORDS (Khatedar & Joint Owners)
CREATE TABLE IF NOT EXISTS ownership_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES land_parcels(id) ON DELETE CASCADE,
    owner_name VARCHAR(255) NOT NULL,
    relation_type VARCHAR(50) DEFAULT 'SELF',
    guardian_name VARCHAR(255),
    aadhaar_hash VARCHAR(64), -- Secure masked reference (e.g. XXXX-XXXX-4921)
    share_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (share_percentage > 0 AND share_percentage <= 100),
    khata_number VARCHAR(50) NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    mutation_number VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRANSFERRED', 'DISPUTED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ownership_records_parcel ON ownership_records(parcel_id);
CREATE INDEX IF NOT EXISTS idx_ownership_records_khata ON ownership_records(khata_number);

-- 4. LAND SURVEY REQUESTS (Mojani & Cadastral Mapping)
CREATE TABLE IF NOT EXISTS survey_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_number_ref VARCHAR(50) UNIQUE NOT NULL, -- e.g. SRV-2024-MH-0091
    parcel_id UUID NOT NULL REFERENCES land_parcels(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_contact VARCHAR(50) NOT NULL,
    survey_type VARCHAR(50) NOT NULL CHECK (survey_type IN ('REGULAR_MEASUREMENT', 'URGENT_TATKAL', 'COURT_COMMISSION', 'SUB_DIVISION_PARTITION', 'BOUNDARY_DEMARCATION')),
    surveyor_id UUID REFERENCES profiles(id),
    scheduled_date DATE,
    completion_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'FIELD_COMPLETED', 'APPROVED', 'REVISION_REQUIRED', 'REJECTED')),
    gps_coordinates JSONB, -- Array of surveyed boundary points
    calculated_area_sqm NUMERIC(12, 2),
    field_notes TEXT,
    dispute_flag BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_requests_parcel ON survey_requests(parcel_id);
CREATE INDEX IF NOT EXISTS idx_survey_requests_status ON survey_requests(status);

-- 5. VERIFICATION & MUTATION APPLICATIONS (Ferfar Register - Form 6)
CREATE TABLE IF NOT EXISTS mutations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mutation_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. FER-2024-00452
    parcel_id UUID NOT NULL REFERENCES land_parcels(id) ON DELETE CASCADE,
    mutation_type VARCHAR(50) NOT NULL CHECK (mutation_type IN ('INHERITANCE_VARAS', 'SALE_DEED_KHARIDI', 'GIFT_DEED_BAKSHIS', 'PARTITION_VATAP', 'BANK_LOAN_BOJHA', 'MORTGAGE_RELEASE')),
    applicant_name VARCHAR(255) NOT NULL,
    transferor_names TEXT,
    transferee_names TEXT NOT NULL,
    notice_publish_date DATE DEFAULT CURRENT_DATE,
    notice_end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '15 days'),
    objections_count INT DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_TALATHI_REVIEW' CHECK (status IN ('PENDING_TALATHI_REVIEW', 'NOTICE_PERIOD', 'CORRECTION_REQUESTED', 'APPROVED_BY_MANDAL_ADHIKARI', 'REJECTED', 'CANCELLED')),
    officer_id UUID REFERENCES profiles(id),
    officer_remarks TEXT,
    approval_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mutations_parcel ON mutations(parcel_id);
CREATE INDEX IF NOT EXISTS idx_mutations_status ON mutations(status);

-- 6. PROPERTY REGISTRATIONS (Deed & SRO Workflow)
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. SRO-PUN-2024-TK881
    parcel_id UUID NOT NULL REFERENCES land_parcels(id) ON DELETE CASCADE,
    seller_name VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    market_valuation NUMERIC(14, 2) NOT NULL,
    consideration_amount NUMERIC(14, 2) NOT NULL,
    stamp_duty_paid NUMERIC(12, 2) NOT NULL,
    registration_fee NUMERIC(12, 2) NOT NULL,
    sro_office VARCHAR(100) NOT NULL,
    appointment_date DATE,
    appointment_slot VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'FEES_PAID', 'APPOINTMENT_SCHEDULED', 'REGISTERED', 'REJECTED')),
    deed_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. QR CODES (Digital Bhu-Aadhaar Identifiers)
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID UNIQUE NOT NULL REFERENCES land_parcels(id) ON DELETE CASCADE,
    qr_identifier VARCHAR(100) UNIQUE NOT NULL, -- Format: BHOOMI-MH-ULPIN-HASH
    secure_hash VARCHAR(128) NOT NULL,
    verification_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED')),
    scans_count INT DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_identifier ON qr_codes(qr_identifier);

-- 8. DOCUMENTS (Digital Abhilekh Vault)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('PARCEL', 'SURVEY', 'MUTATION', 'REGISTRATION')),
    entity_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('EXTRACT_7_12', 'FORM_8A', 'SALE_DEED', 'CADASTRAL_MAP_TIPAN', 'SURVEY_REPORT', 'IDENTITY_PROOF', 'TAX_RECEIPT', 'AFFIDAVIT')),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_kb INT DEFAULT 1024,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    uploaded_by UUID REFERENCES profiles(id),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO' CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ALERT')),
    is_read BOOLEAN DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOGS (Immutable Gov Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 11. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Settings
INSERT INTO system_settings (key, value, description)
VALUES 
  ('portal_name', '"Digital Bhoomi Maharashtra (Prototype)"', 'Public title of the application'),
  ('disclaimer_watermark', 'true', 'Enable prominent demonstration watermark on all documents'),
  ('maintenance_mode', 'false', 'Simulate system maintenance state'),
  ('default_stamp_duty_rate', '0.06', 'Default 6% (5% Stamp Duty + 1% Local Cess) in Maharashtra'),
  ('sro_offices_active', '["Haveli-1", "Haveli-2", "Mulshi", "Nagpur-Rural", "Nashik-Central"]', 'Active SRO Offices list')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read for prototype demonstration
CREATE POLICY "Public Read Parcels" ON land_parcels FOR SELECT USING (true);
CREATE POLICY "Public Read Ownership" ON ownership_records FOR SELECT USING (true);
CREATE POLICY "Public Read Survey" ON survey_requests FOR SELECT USING (true);
CREATE POLICY "Public Read Mutations" ON mutations FOR SELECT USING (true);
CREATE POLICY "Public Read Registrations" ON registrations FOR SELECT USING (true);
CREATE POLICY "Public Read QR" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "Public Read Documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Public Read Notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public Read Audit" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON system_settings FOR SELECT USING (true);

-- Allow authenticated/demo mutations
CREATE POLICY "Allow All Demo Inserts" ON land_parcels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Demo Updates" ON land_parcels FOR UPDATE USING (true);
CREATE POLICY "Allow All Survey Inserts" ON survey_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Survey Updates" ON survey_requests FOR UPDATE USING (true);
CREATE POLICY "Allow All Mutation Inserts" ON mutations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Mutation Updates" ON mutations FOR UPDATE USING (true);
CREATE POLICY "Allow All Audit Inserts" ON audit_logs FOR INSERT WITH CHECK (true);
