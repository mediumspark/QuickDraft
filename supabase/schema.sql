-- QuickDraft Supabase schema
-- Run this in your Supabase SQL editor

-- ============================================================
-- Profiles (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Agreements
-- ============================================================
CREATE TABLE IF NOT EXISTS agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  agreement_type TEXT NOT NULL,
  data JSONB NOT NULL,
  share_token TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add user_id if table already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agreements' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE agreements ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agreements_session ON agreements(session_id);
CREATE INDEX IF NOT EXISTS idx_agreements_user ON agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_agreements_share_token ON agreements(share_token);

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert" ON agreements;
DROP POLICY IF EXISTS "Allow anonymous update own session" ON agreements;
DROP POLICY IF EXISTS "Allow read shared agreements" ON agreements;

CREATE POLICY "Users can insert own agreements" ON agreements
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own agreements" ON agreements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own agreements" ON agreements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read shared agreements" ON agreements
  FOR SELECT USING (is_shared = true);

CREATE POLICY "Users can delete own agreements" ON agreements
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Purchases (written by Edge Functions via service role)
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  credits_added INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Credit usage (written by Edge Functions via service role)
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('download', 'share')),
  consumed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, agreement_id, action)
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_agreement ON credit_usage(agreement_id);

ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credit usage" ON credit_usage
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Helper RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_credit_balance()
RETURNS INTEGER AS $$
  SELECT COALESCE(credits, 0) FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_unlocked(p_agreement_id UUID, p_action TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.credit_usage
    WHERE user_id = auth.uid()
      AND agreement_id = p_agreement_id
      AND action = p_action
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
