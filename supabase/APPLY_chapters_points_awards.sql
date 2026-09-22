-- Chapters, page layout, points, awards, richer profiles
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run (idempotent).

-- ============================================================
-- Profile: public fields + private wallet
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points_earned INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_verified_writer BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_bio_length;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 300);

-- Private balance (owner-only via RLS)
CREATE TABLE IF NOT EXISTS public.profile_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 5 CHECK (points_balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profile_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own wallet" ON public.profile_wallets;
DROP POLICY IF EXISTS "Users update own wallet blocked" ON public.profile_wallets;

CREATE POLICY "Users read own wallet" ON public.profile_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Direct client updates blocked; mutations go through RPCs
CREATE POLICY "No direct wallet updates" ON public.profile_wallets
  FOR UPDATE USING (false);

CREATE POLICY "No direct wallet inserts" ON public.profile_wallets
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct wallet deletes" ON public.profile_wallets
  FOR DELETE USING (false);

GRANT SELECT ON public.profile_wallets TO authenticated;

-- Seed wallets for existing profiles
INSERT INTO public.profile_wallets (user_id, points_balance)
SELECT id, 5 FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Ensure new users get wallet + default earned seed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, points_earned, is_verified_writer)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    5,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.profile_wallets (user_id, points_balance)
  VALUES (NEW.id, 5)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill points_earned seed where somehow missing (column default handles new)
UPDATE public.profiles SET points_earned = 5 WHERE points_earned IS NULL OR points_earned < 5;

-- ============================================================
-- Drafts / posts: chapters, page layout, page_count
-- ============================================================
ALTER TABLE public.drafts
  ADD COLUMN IF NOT EXISTS chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS page_layout JSONB NOT NULL DEFAULT '{"preset":"standard","width_in":6,"height_in":9,"margin_in":0.75,"font_scale":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS page_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS page_layout JSONB NOT NULL DEFAULT '{"preset":"standard","width_in":6,"height_in":9,"margin_in":0.75,"font_scale":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS page_count INTEGER NOT NULL DEFAULT 1;

-- Backfill chapters from body when empty
UPDATE public.drafts
SET chapters = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'title', 'Chapter 1',
    'sort_order', 0,
    'body', COALESCE(body, '')
  )
)
WHERE chapters = '[]'::jsonb OR chapters IS NULL;

UPDATE public.forum_posts
SET chapters = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'title', 'Chapter 1',
    'sort_order', 0,
    'body', COALESCE(body, '')
  )
)
WHERE chapters = '[]'::jsonb OR chapters IS NULL;

-- ============================================================
-- Points ledger
-- ============================================================
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta_earned INTEGER NOT NULL DEFAULT 0,
  delta_balance INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  ref_type TEXT,
  ref_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user
  ON public.points_ledger(user_id, created_at DESC);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ledger" ON public.points_ledger;
CREATE POLICY "Users read own ledger" ON public.points_ledger
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON public.points_ledger TO authenticated;

-- ============================================================
-- Upvotes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_upvotes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  weight INTEGER NOT NULL CHECK (weight >= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_upvotes_post ON public.post_upvotes(post_id);

ALTER TABLE public.post_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read upvotes" ON public.post_upvotes;
DROP POLICY IF EXISTS "Users insert own upvotes blocked" ON public.post_upvotes;
DROP POLICY IF EXISTS "Users delete own upvotes" ON public.post_upvotes;

CREATE POLICY "Anyone can read upvotes" ON public.post_upvotes
  FOR SELECT USING (true);

-- Inserts via RPC only
CREATE POLICY "No direct upvote inserts" ON public.post_upvotes
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Users delete own upvotes" ON public.post_upvotes
  FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, DELETE ON public.post_upvotes TO authenticated;
GRANT SELECT ON public.post_upvotes TO anon;

-- ============================================================
-- Awards
-- ============================================================
CREATE TABLE IF NOT EXISTS public.awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'star',
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  stripe_price_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active awards" ON public.awards;
CREATE POLICY "Anyone can read active awards" ON public.awards
  FOR SELECT USING (active = true);

GRANT SELECT ON public.awards TO anon, authenticated;

INSERT INTO public.awards (slug, name, description, icon, points_cost, sort_order) VALUES
  ('insightful', 'Insightful', 'Sharp thinking that sticks with you.', 'lightbulb', 25, 10),
  ('moving', 'Moving', 'Hit you right in the feels.', 'heart', 30, 20),
  ('craft', 'Craft', 'Beautiful prose and careful craft.', 'pen', 40, 30),
  ('spotlight', 'Spotlight', 'This deserves more eyes.', 'sparkles', 60, 40),
  ('gold-star', 'Gold Star', 'An outstanding piece of work.', 'star', 100, 50),
  ('mentor', 'Mentor Mark', 'Generous, useful critique energy.', 'award', 50, 60)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points_cost = EXCLUDED.points_cost,
  sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.award_inventory (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  award_id UUID NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  PRIMARY KEY (user_id, award_id)
);

ALTER TABLE public.award_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own inventory" ON public.award_inventory;
CREATE POLICY "Users read own inventory" ON public.award_inventory
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON public.award_inventory TO authenticated;

CREATE TABLE IF NOT EXISTS public.post_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  award_id UUID NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_awards_post ON public.post_awards(post_id);

ALTER TABLE public.post_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read post awards" ON public.post_awards;
CREATE POLICY "Anyone can read post awards" ON public.post_awards
  FOR SELECT USING (true);

GRANT SELECT ON public.post_awards TO anon, authenticated;

-- Stripe purchase records (webhook credits inventory)
CREATE TABLE IF NOT EXISTS public.award_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  award_id UUID NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.award_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own purchases" ON public.award_purchases;
CREATE POLICY "Users read own purchases" ON public.award_purchases
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON public.award_purchases TO authenticated;

-- ============================================================
-- Helpers / RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.upvote_weight(p_points_earned INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(5, FLOOR(SQRT(GREATEST(COALESCE(p_points_earned, 5), 0)))::INTEGER);
$$;

CREATE OR REPLACE FUNCTION public.refresh_verified_writer(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_writing BOOLEAN;
  has_upvote BOOLEAN;
  has_critique BOOLEAN;
  verified BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.forum_posts
    WHERE user_id = p_user_id
      AND status = 'published'
      AND post_kind = 'writing'
  ) INTO has_writing;

  SELECT EXISTS (
    SELECT 1
    FROM public.post_upvotes u
    JOIN public.forum_posts p ON p.id = u.post_id
    WHERE p.user_id = p_user_id
      AND p.post_kind = 'writing'
  ) INTO has_upvote;

  SELECT EXISTS (
    SELECT 1
    FROM public.forum_comments c
    JOIN public.forum_posts p ON p.id = c.post_id
    WHERE p.user_id = p_user_id
      AND p.post_kind = 'writing'
      AND c.user_id <> p_user_id
      AND c.anchor_type = 'general'
  ) INTO has_critique;

  verified := has_writing AND has_upvote AND has_critique;

  PERFORM set_config('app.bypass_profile_protect', '1', true);

  UPDATE public.profiles
  SET is_verified_writer = verified
  WHERE id = p_user_id;

  RETURN verified;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_points(
  p_user_id UUID,
  p_delta_earned INTEGER,
  p_delta_balance INTEGER,
  p_reason TEXT,
  p_ref_type TEXT DEFAULT NULL,
  p_ref_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user required';
  END IF;

  IF COALESCE(p_delta_earned, 0) = 0 AND COALESCE(p_delta_balance, 0) = 0 THEN
    RETURN;
  END IF;

  PERFORM set_config('app.bypass_profile_protect', '1', true);

  IF COALESCE(p_delta_earned, 0) <> 0 THEN
    UPDATE public.profiles
    SET points_earned = GREATEST(0, points_earned + p_delta_earned)
    WHERE id = p_user_id;
  END IF;

  IF COALESCE(p_delta_balance, 0) <> 0 THEN
    INSERT INTO public.profile_wallets (user_id, points_balance)
    VALUES (p_user_id, 5)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.profile_wallets
    SET points_balance = GREATEST(0, points_balance + p_delta_balance),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.points_ledger (user_id, delta_earned, delta_balance, reason, ref_type, ref_id)
  VALUES (p_user_id, COALESCE(p_delta_earned, 0), COALESCE(p_delta_balance, 0), p_reason, p_ref_type, p_ref_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_publish_points(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post RECORD;
  pages INTEGER;
  grant_amt INTEGER;
  already BOOLEAN;
  verified BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT * INTO post FROM public.forum_posts WHERE id = p_post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  IF post.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not your post';
  END IF;
  IF post.post_kind <> 'writing' OR post.status <> 'published' THEN
    RETURN jsonb_build_object('granted', 0, 'reason', 'not_eligible_post');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.points_ledger
    WHERE user_id = post.user_id
      AND reason = 'publish'
      AND ref_type = 'forum_post'
      AND ref_id = p_post_id::text
  ) INTO already;

  IF already THEN
    RETURN jsonb_build_object('granted', 0, 'reason', 'already_granted');
  END IF;

  verified := public.refresh_verified_writer(post.user_id);
  IF NOT verified THEN
    RETURN jsonb_build_object('granted', 0, 'reason', 'not_verified');
  END IF;

  pages := GREATEST(COALESCE(post.page_count, 1), 1);
  grant_amt := pages * 5;
  PERFORM public.apply_points(post.user_id, grant_amt, grant_amt, 'publish', 'forum_post', p_post_id::text);
  RETURN jsonb_build_object('granted', grant_amt, 'pages', pages);
END;
$$;

CREATE OR REPLACE FUNCTION public.cast_upvote(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post RECORD;
  voter_earned INTEGER;
  weight INTEGER;
  author_verified BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT * INTO post FROM public.forum_posts WHERE id = p_post_id;
  IF NOT FOUND OR post.status <> 'published' THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  IF post.post_kind <> 'writing' THEN
    RAISE EXCEPTION 'Only writing posts can be upvoted';
  END IF;
  IF post.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot upvote your own post';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.post_upvotes WHERE user_id = auth.uid() AND post_id = p_post_id
  ) THEN
    RAISE EXCEPTION 'Already upvoted';
  END IF;

  SELECT points_earned INTO voter_earned FROM public.profiles WHERE id = auth.uid();
  weight := public.upvote_weight(COALESCE(voter_earned, 5));

  INSERT INTO public.post_upvotes (user_id, post_id, weight)
  VALUES (auth.uid(), p_post_id, weight);

  -- Receiving an upvote can unlock verification for the author
  author_verified := public.refresh_verified_writer(post.user_id);

  IF author_verified THEN
    PERFORM public.apply_points(post.user_id, weight, weight, 'upvote', 'forum_post', p_post_id::text);
  END IF;

  -- Voter may become verified later; also refresh voter (no-op usually)
  PERFORM public.refresh_verified_writer(auth.uid());

  RETURN jsonb_build_object(
    'weight', weight,
    'author_granted', CASE WHEN author_verified THEN weight ELSE 0 END,
    'author_verified', author_verified
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_critique_points(
  p_post_id UUID,
  p_comment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post RECORD;
  comment RECORD;
  verified BOOLEAN;
  already BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT * INTO comment FROM public.forum_comments WHERE id = p_comment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;
  IF comment.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not your comment';
  END IF;
  IF comment.post_id <> p_post_id THEN
    RAISE EXCEPTION 'Comment/post mismatch';
  END IF;
  IF comment.anchor_type <> 'general' THEN
    RETURN jsonb_build_object('granted', 0, 'reason', 'not_general_critique');
  END IF;

  SELECT * INTO post FROM public.forum_posts WHERE id = p_post_id;
  IF NOT FOUND OR post.post_kind <> 'writing' OR post.status <> 'published' THEN
    RETURN jsonb_build_object('granted', 0, 'reason', 'not_eligible_post');
  END IF;
  IF post.user_id = auth.uid() THEN
    RETURN jsonb_build_object('granted', 0, 'reason', 'own_post');
  END IF;

  -- One grant per commenter per post
  SELECT EXISTS (
    SELECT 1 FROM public.points_ledger
    WHERE user_id = post.user_id
      AND reason = 'critique'
      AND ref_type = 'forum_post_commenter'
      AND ref_id = (p_post_id::text || ':' || auth.uid()::text)
  ) INTO already;

  IF already THEN
    RETURN jsonb_build_object('granted', 0, 'reason', 'already_granted');
  END IF;

  verified := public.refresh_verified_writer(post.user_id);
  IF NOT verified THEN
    RETURN jsonb_build_object('granted', 0, 'reason', 'not_verified');
  END IF;

  PERFORM public.apply_points(
    post.user_id, 2, 2, 'critique', 'forum_post_commenter',
    p_post_id::text || ':' || auth.uid()::text
  );

  RETURN jsonb_build_object('granted', 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_points_for_award(
  p_award_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  award RECORD;
  cost INTEGER;
  bal INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;
  IF COALESCE(p_quantity, 0) < 1 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  SELECT * INTO award FROM public.awards WHERE id = p_award_id AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Award not found';
  END IF;

  cost := award.points_cost * p_quantity;

  SELECT points_balance INTO bal FROM public.profile_wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF bal IS NULL THEN
    INSERT INTO public.profile_wallets (user_id, points_balance) VALUES (auth.uid(), 5);
    bal := 5;
  END IF;
  IF bal < cost THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  PERFORM public.apply_points(auth.uid(), 0, -cost, 'award_purchase', 'award', p_award_id::text);

  INSERT INTO public.award_inventory (user_id, award_id, quantity)
  VALUES (auth.uid(), p_award_id, p_quantity)
  ON CONFLICT (user_id, award_id) DO UPDATE
  SET quantity = public.award_inventory.quantity + EXCLUDED.quantity;

  RETURN jsonb_build_object('spent', cost, 'award_id', p_award_id, 'quantity', p_quantity);
END;
$$;

CREATE OR REPLACE FUNCTION public.give_award(
  p_post_id UUID,
  p_award_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv INTEGER;
  post RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT * INTO post FROM public.forum_posts WHERE id = p_post_id AND status = 'published';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  SELECT quantity INTO inv
  FROM public.award_inventory
  WHERE user_id = auth.uid() AND award_id = p_award_id
  FOR UPDATE;

  IF COALESCE(inv, 0) < 1 THEN
    RAISE EXCEPTION 'No award in inventory';
  END IF;

  UPDATE public.award_inventory
  SET quantity = quantity - 1
  WHERE user_id = auth.uid() AND award_id = p_award_id;

  INSERT INTO public.post_awards (post_id, award_id, giver_id)
  VALUES (p_post_id, p_award_id, auth.uid());

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Service-role helper for Stripe webhook (called with service key)
CREATE OR REPLACE FUNCTION public.credit_award_purchase(
  p_user_id UUID,
  p_award_id UUID,
  p_quantity INTEGER,
  p_stripe_session_id TEXT,
  p_stripe_payment_intent TEXT DEFAULT NULL,
  p_amount_cents INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_award_id IS NULL OR COALESCE(p_quantity, 0) < 1 THEN
    RAISE EXCEPTION 'Invalid purchase';
  END IF;

  IF p_stripe_session_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.award_purchases WHERE stripe_session_id = p_stripe_session_id
  ) THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  INSERT INTO public.award_purchases (
    user_id, award_id, quantity, stripe_session_id, stripe_payment_intent, amount_cents
  ) VALUES (
    p_user_id, p_award_id, p_quantity, p_stripe_session_id, p_stripe_payment_intent, p_amount_cents
  );

  INSERT INTO public.award_inventory (user_id, award_id, quantity)
  VALUES (p_user_id, p_award_id, p_quantity)
  ON CONFLICT (user_id, award_id) DO UPDATE
  SET quantity = public.award_inventory.quantity + EXCLUDED.quantity;

  RETURN jsonb_build_object('ok', true, 'duplicate', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_verified_writer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_publish_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_upvote(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_critique_points(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_points_for_award(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.give_award(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upvote_weight(INTEGER) TO anon, authenticated;
-- credit_award_purchase: service role only (no grant to anon/authenticated)

-- ============================================================
-- Storage: avatars bucket (run after enabling Storage)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Block client forgery of points / verification / admin
CREATE OR REPLACE FUNCTION public.protect_profile_points()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF current_setting('app.bypass_profile_protect', true) = '1' THEN
      RETURN NEW;
    END IF;
    NEW.points_earned := OLD.points_earned;
    NEW.is_verified_writer := OLD.is_verified_writer;
    IF auth.uid() IS NOT NULL AND auth.role() = 'authenticated' THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_points_trg ON public.profiles;
CREATE TRIGGER protect_profile_points_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_points();

NOTIFY pgrst, 'reload schema';
