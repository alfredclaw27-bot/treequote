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
  -- Linked Supabase Auth user once the customer creates an account
  -- (see /customer/setup). Matched by email, set via a service-role API route.
  auth_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE IF NOT EXISTS tq_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES tq_customers(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL DEFAULT '',
  photo_urls TEXT[] DEFAULT '{}',
  details JSONB DEFAULT '{}',
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
  lead_credits INTEGER DEFAULT 0,
  is_founding BOOLEAN DEFAULT false,
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

-- Lead Access (tracks which contractors unlocked which leads — via Stripe or a free credit)
CREATE TABLE IF NOT EXISTS tq_lead_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES tq_leads(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES tq_contractors(id) ON DELETE SET NULL,
  paid BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed')),
  unlock_method TEXT DEFAULT 'stripe' CHECK (unlock_method IN ('stripe', 'credit')),
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, contractor_id)
);

-- Lead Notifications (one row per attempted contractor alert — see lib/notifications.ts)
CREATE TABLE IF NOT EXISTS tq_lead_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES tq_leads(id) ON DELETE SET NULL,
  contractor_name TEXT,
  contractor_email TEXT,
  contractor_phone TEXT,
  channel TEXT DEFAULT 'email',
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Outreach Contractors (admin supply-side CRM — see migrations/2026-07-16-outreach.sql
-- for full context. GTM Phase 1: Google Places results found per-lead or via
-- freeform search, manually called/emailed by the site owner from /admin.)
CREATE TABLE IF NOT EXISTS tq_outreach_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES tq_leads(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'places',
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  rating NUMERIC,
  review_count INT,
  address TEXT,
  maps_url TEXT,
  status TEXT NOT NULL DEFAULT 'found' CHECK (status IN ('found', 'contacted', 'no_answer', 'responded', 'joined', 'declined')),
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tq_outreach_contractors_dedupe_idx
  ON tq_outreach_contractors (COALESCE(phone, ''), lower(name));

-- Lead Events (customer comments + tracked edits on a lead — see
-- lib/lead-events.ts and migrations/2026-07-16-lead-events.sql)
CREATE TABLE IF NOT EXISTS tq_lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES tq_leads(id) ON DELETE CASCADE,
  actor TEXT NOT NULL CHECK (actor IN ('customer', 'contractor', 'admin')),
  type TEXT NOT NULL CHECK (type IN ('comment', 'edit')),
  body TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tq_lead_events_lead_id ON tq_lead_events(lead_id);

-- RLS
ALTER TABLE tq_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_lead_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_lead_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_outreach_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tq_lead_events ENABLE ROW LEVEL SECURITY;

-- Relax RLS for MVP (full public access)
CREATE POLICY "public_read_write" ON tq_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_contractors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_lead_access FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_lead_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tq_lead_events FOR ALL USING (true) WITH CHECK (true);
-- tq_outreach_contractors intentionally has NO public policy — admin-only
-- data, reachable only via the service-role key (app/api/admin/outreach/**).

-- =============================================
-- Storage Bucket
-- Run in Supabase Dashboard > Storage > New Bucket
-- Name: <appSlug>-photos (see `photoStorageBucket` in config/site.ts,
-- derived from brand.shortName — e.g. "treequote-photos") — Public: true
-- =============================================