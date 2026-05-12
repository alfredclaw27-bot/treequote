-- =============================================
-- TreeQuote — Supabase Schema (prefixed tq_*)
-- Run via Supabase Dashboard SQL Editor
-- =============================================

-- Customers
CREATE TABLE IF NOT EXISTS tq_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE IF NOT EXISTS tq_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES tq_customers(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL DEFAULT '',
  analysis_data JSONB,
  estimated_price JSONB,
  service_types TEXT[] NOT NULL DEFAULT '{}',
  address TEXT NOT NULL DEFAULT '',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_maps_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'quoted', 'closed')),
  stripe_payment_id TEXT,
  notifications_sent INTEGER DEFAULT 0,
  notification_targets TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contractors
CREATE TABLE IF NOT EXISTS tq_contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '',
  business_name TEXT NOT NULL,
  phone TEXT,
  service_area TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  approved BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  equipment JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quotes
CREATE TABLE IF NOT EXISTS tq_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES tq_leads(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES tq_contractors(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  estimated_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead Access (tracks which contractors paid for which leads)
CREATE TABLE IF NOT EXISTS tq_lead_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES tq_leads(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES tq_contractors(id) ON DELETE SET NULL,
  paid BOOLEAN DEFAULT false,
  stripe_payment_id TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, contractor_id)
);

-- RLS
ALTER TABLE tq_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_lead_access ENABLE ROW LEVEL SECURITY;

-- Relax RLS for MVP (full public access)
CREATE POLICY "public_read_write" ON tq_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_contractors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_lead_access FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Storage Bucket
-- Run in Supabase Dashboard > Storage > New Bucket
-- Name: tree-photos — Public: true
-- =============================================