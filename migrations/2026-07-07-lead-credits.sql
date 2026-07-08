-- =============================================
-- Migration: 2026-07-07 — lead credits, founding contractors,
-- structured lead details, multi-photo, unlock tracking
--
-- Run this in the Supabase Dashboard SQL Editor against an EXISTING
-- TreeQuote database. Safe to re-run (uses IF NOT EXISTS / ADD COLUMN
-- guards). New installs should just use lib/supabase/schema.sql, which
-- already includes these columns.
-- =============================================

-- Contractors: free lead credits + founding-contractor flag
ALTER TABLE tq_contractors
  ADD COLUMN IF NOT EXISTS lead_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_founding BOOLEAN DEFAULT false;

-- Leads: structured details schema (config-driven) + multi-photo support
ALTER TABLE tq_leads
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- Lead access: track how a lead was unlocked (Stripe vs. a free credit),
-- and normalize on `payment_status` for both paths.
ALTER TABLE tq_lead_access
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS unlock_method TEXT DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Backfill payment_status from the old boolean `paid` column if present
UPDATE tq_lead_access SET payment_status = 'completed' WHERE paid = true AND payment_status IS DISTINCT FROM 'completed';

-- Constraints (guarded — Postgres has no ADD CONSTRAINT IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tq_lead_access_payment_status_check'
  ) THEN
    ALTER TABLE tq_lead_access
      ADD CONSTRAINT tq_lead_access_payment_status_check CHECK (payment_status IN ('pending', 'completed'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tq_lead_access_unlock_method_check'
  ) THEN
    ALTER TABLE tq_lead_access
      ADD CONSTRAINT tq_lead_access_unlock_method_check CHECK (unlock_method IN ('stripe', 'credit'));
  END IF;
END $$;
