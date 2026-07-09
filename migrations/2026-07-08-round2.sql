-- =============================================
-- Migration: 2026-07-08 (round 2) — customer accounts, quote-notification
-- emails, contractor-alert privacy masking, and the admin contact log.
--
-- Run this in the Supabase Dashboard SQL Editor against an EXISTING
-- TreeQuote database. Safe to re-run (uses IF NOT EXISTS / ADD COLUMN
-- guards). New installs should just use lib/supabase/schema.sql, which
-- already includes these.
-- =============================================

-- Customers: link to a Supabase Auth user once they create an account via
-- /customer/setup (matched by email, set via a service-role API route).
ALTER TABLE tq_customers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Lead notifications: one row per attempted contractor alert (email today —
-- `channel` leaves room for SMS later), including stub-mode attempts when
-- Supabase is configured but RESEND_API_KEY isn't. Powers the admin
-- "contact log" (who was notified, when, with what result).
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

ALTER TABLE tq_lead_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tq_lead_notifications' AND policyname = 'public_read_write'
  ) THEN
    CREATE POLICY "public_read_write" ON tq_lead_notifications FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
