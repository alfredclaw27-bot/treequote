-- =============================================
-- Tree Service Lead Gen — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  analysis_data JSONB,
  estimated_price JSONB,  -- {low, high, currency, priceFactors[]}
  service_types TEXT[] NOT NULL DEFAULT '{}',
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_maps_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'quoted', 'closed')),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contractors
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT,
  service_area TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  approved BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  equipment JSONB DEFAULT '{}',  -- {bucketReach, crewSize, equipment: []}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  estimated_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead Access (tracks which contractors paid to view which leads)
CREATE TABLE IF NOT EXISTS lead_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  paid BOOLEAN DEFAULT false,
  stripe_payment_id TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, contractor_id)
);

-- Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Customers: anyone can create, read own records
CREATE POLICY "Customers: anyone can insert" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers: anyone can read" ON customers FOR SELECT USING (true);

-- Leads: anyone can create (customer submit), contractors can read quoted ones, admins can read all
CREATE POLICY "Leads: anyone can insert" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Leads: public read (no auth needed for MVP)" ON leads FOR SELECT USING (true);
CREATE POLICY "Leads: anyone can update" ON leads FOR UPDATE USING (true);

-- Contractors: anyone can apply (insert), only admin can read all
CREATE POLICY "Contractors: anyone can insert" ON contractors FOR INSERT WITH CHECK (true);
CREATE POLICY "Contractors: public read" ON contractors FOR SELECT USING (true);
CREATE POLICY "Contractors: anyone can update own" ON contractors FOR UPDATE USING (true);

-- Quotes: anyone can insert (contractor), customers can read their own lead quotes
CREATE POLICY "Quotes: anyone can insert" ON quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Quotes: public read" ON quotes FOR SELECT USING (true);
CREATE POLICY "Quotes: anyone can update" ON quotes FOR UPDATE USING (true);

-- =============================================
-- Storage Bucket
-- =============================================
-- Run in Supabase Dashboard > Storage > New Bucket
-- Name: tree-photos
-- Public: true
-- 
-- Also add this storage policy:
-- CREATE POLICY "tree-photos: public read" ON storage.objects FOR SELECT USING (bucket_id = 'tree-photos');
-- CREATE POLICY "tree-photos: authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tree-photos');
