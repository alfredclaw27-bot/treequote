-- =============================================
-- Migration: 2026-07-16 — admin supply-side outreach tracker.
--
-- GTM Phase 1: for each incoming customer lead, Mike finds nearby tree
-- service companies (via Google Places API "New", see scripts/find-contractors.mjs
-- and lib/outreach.ts) and manually calls/emails them to build the
-- contractor supply side before running ads. This table tracks who was
-- found, whether they've been contacted, and whether they responded/joined.
--
-- Run this in the Supabase Dashboard SQL Editor against an EXISTING
-- TreeQuote database. Safe to re-run (uses IF NOT EXISTS guards). New
-- installs should just use lib/supabase/schema.sql, which already includes
-- this table.
-- =============================================

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

-- Dedupe: same phone+name shouldn't be inserted twice across repeated
-- searches for overlapping areas. Coalesce phone to '' so companies with no
-- phone still dedupe on name alone (rare, but avoids a NULL-never-equals-NULL
-- footgun with a plain UNIQUE(phone, name)).
CREATE UNIQUE INDEX IF NOT EXISTS tq_outreach_contractors_dedupe_idx
  ON tq_outreach_contractors (COALESCE(phone, ''), lower(name));

ALTER TABLE tq_outreach_contractors ENABLE ROW LEVEL SECURITY;

-- Admin-only data (found via the site owner's own Places API key, viewed
-- only on the secret-gated /admin page). Unlike the public-facing tables,
-- no public policy is added — only the service-role key (used by
-- app/api/admin/outreach/**) can read/write this table.
