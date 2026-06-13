-- QuickDraft Supabase schema (pay-per-document + optional accounts)
-- Run this in your Supabase SQL editor

-- ============================================================
-- Profiles (created on sign-up)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Agreements (optional cloud save + share links)
-- ============================================================
CREATE TABLE IF NOT EXISTS agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agreement_type TEXT NOT NULL,
  data JSONB NOT NULL,
  share_token TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id if upgrading from older schema
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agreements_session ON agreements(session_id);
CREATE INDEX IF NOT EXISTS idx_agreements_user ON agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_agreements_share_token ON agreements(share_token);

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert agreements" ON agreements;
DROP POLICY IF EXISTS "Allow update agreements" ON agreements;
DROP POLICY IF EXISTS "Allow read shared agreements" ON agreements;
DROP POLICY IF EXISTS "Users can insert own agreements" ON agreements;
DROP POLICY IF EXISTS "Users can update own agreements" ON agreements;
DROP POLICY IF EXISTS "Users can read own agreements" ON agreements;
DROP POLICY IF EXISTS "Anyone can read shared agreements" ON agreements;
DROP POLICY IF EXISTS "Users can delete own agreements" ON agreements;
DROP POLICY IF EXISTS "Allow anonymous insert" ON agreements;
DROP POLICY IF EXISTS "Allow anonymous update own session" ON agreements;

-- Guests can still draft without an account
CREATE POLICY "Allow insert agreements" ON agreements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update agreements" ON agreements
  FOR UPDATE USING (
    user_id IS NULL
    OR user_id = auth.uid()
  );

CREATE POLICY "Allow read shared agreements" ON agreements
  FOR SELECT USING (is_shared = true);

CREATE POLICY "Users can read own agreements" ON agreements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can delete own agreements" ON agreements
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- Document payments (pay-per-document)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('download', 'share')),
  stripe_session_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 500,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (document_id, action)
);

ALTER TABLE document_payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_document_payments_document ON document_payments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_payments_user ON document_payments(user_id);

ALTER TABLE document_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own payments" ON document_payments;

CREATE POLICY "Users can read own payments" ON document_payments
  FOR SELECT USING (user_id = auth.uid());

-- Written by Edge Functions via service role; no public insert/update policies
