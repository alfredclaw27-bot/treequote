-- =============================================
-- Migration: 2026-07-16 — lead comments + tracked edits (tq_lead_events)
--
-- Lets a customer add comments to their submitted request and edit their
-- job details (never contact info), with every change recorded with a
-- date/time and a human-readable field diff. See lib/lead-events.ts for the
-- diff logic and app/customer/quotes/[leadId]/page.tsx for the UI.
--
-- Run this in the Supabase Dashboard SQL Editor against an EXISTING
-- TreeQuote database. Safe to re-run (uses IF NOT EXISTS guards). New
-- installs should just use lib/supabase/schema.sql, which already includes
-- this table.
-- =============================================

CREATE TABLE IF NOT EXISTS tq_lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES tq_leads(id) ON DELETE CASCADE,
  actor TEXT NOT NULL CHECK (actor IN ('customer', 'contractor', 'admin')),
  type TEXT NOT NULL CHECK (type IN ('comment', 'edit')),
  -- Comment text (type = 'comment')
  body TEXT,
  -- Array of {field, label, old, new} (type = 'edit') — see LeadEventChange in types/index.ts
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tq_lead_events_lead_id ON tq_lead_events(lead_id);

ALTER TABLE tq_lead_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tq_lead_events' AND policyname = 'public_read_write'
  ) THEN
    CREATE POLICY "public_read_write" ON tq_lead_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
