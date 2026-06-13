-- QuickDraft Supabase schema (pay-per-document, no accounts)
-- Run this in your Supabase SQL editor

-- ============================================================
-- Agreements (optional cloud save + share links)
-- ============================================================
CREATE TABLE IF NOT EXISTS agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  agreement_type TEXT NOT NULL,
  data JSONB NOT NULL,
  share_token TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agreements_session ON agreements(session_id);
CREATE INDEX IF NOT EXISTS idx_agreements_share_token ON agreements(share_token);

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert" ON agreements;
DROP POLICY IF EXISTS "Allow anonymous update own session" ON agreements;
DROP POLICY IF EXISTS "Allow read shared agreements" ON agreements;
DROP POLICY IF EXISTS "Users can insert own agreements" ON agreements;
DROP POLICY IF EXISTS "Users can update own agreements" ON agreements;
DROP POLICY IF EXISTS "Users can read own agreements" ON agreements;
DROP POLICY IF EXISTS "Anyone can read shared agreements" ON agreements;
DROP POLICY IF EXISTS "Users can delete own agreements" ON agreements;

CREATE POLICY "Allow insert agreements" ON agreements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update agreements" ON agreements
  FOR UPDATE USING (true);

CREATE POLICY "Allow read shared agreements" ON agreements
  FOR SELECT USING (is_shared = true);

-- ============================================================
-- Document payments (pay-per-document, no user accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('download', 'share')),
  stripe_session_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 500,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (document_id, action)
);

CREATE INDEX IF NOT EXISTS idx_document_payments_document ON document_payments(document_id);

-- Written by Edge Functions via service role; no public RLS needed
ALTER TABLE document_payments ENABLE ROW LEVEL SECURITY;
