-- ─── SaaS Subscription Schema Migration ──────────────────────────────────────
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Adds subscription columns to the companies table and sets up RLS policies.

-- ── 1. Add subscription columns to companies ─────────────────────────────────

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS subscription_status  TEXT    NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS plan_id              TEXT    NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- ── 2. Set trial_ends_at for existing companies that don't have it yet ────────

UPDATE companies
SET trial_ends_at = NOW() + INTERVAL '30 days'
WHERE trial_ends_at IS NULL;

-- ── 3. Create companies table if it doesn't exist yet ────────────────────────
-- (skip this block if companies table already exists)

CREATE TABLE IF NOT EXISTS companies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  email                   TEXT,
  subscription_status     TEXT NOT NULL DEFAULT 'trial',
  plan_id                 TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at           TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  subscription_period_end TIMESTAMPTZ,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. RLS — companies table ─────────────────────────────────────────────────

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop policies if they already exist, then recreate
DROP POLICY IF EXISTS "companies_select_own"    ON companies;
DROP POLICY IF EXISTS "companies_service_role_all" ON companies;

-- Admins can read their own company
CREATE POLICY "companies_select_own"
  ON companies FOR SELECT
  USING (
    id = (
      SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
    )
  );

-- Service role (Edge Functions) can do anything
CREATE POLICY "companies_service_role_all"
  ON companies FOR ALL
  USING (auth.role() = 'service_role');

-- ── 5. Grant service_role access to stripe_* columns ─────────────────────────
-- (Supabase Edge Functions use the service_role key — no extra grant needed
--  because service_role bypasses RLS by default)

-- ── 6. Index for Stripe customer lookup ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS companies_stripe_customer_id_idx
  ON companies (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ── 7. Verify ────────────────────────────────────────────────────────────────
-- SELECT id, name, subscription_status, plan_id, trial_ends_at FROM companies LIMIT 5;
