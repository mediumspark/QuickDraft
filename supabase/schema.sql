-- AQuickDraft writing app — full backend schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run (idempotent).

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Profiles (required before drafts / posts / comments)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade legacy profiles tables (CREATE IF NOT EXISTS won't add columns)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Copy common legacy name fields into display_name when empty
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    UPDATE public.profiles
    SET display_name = COALESCE(NULLIF(display_name, ''), NULLIF(full_name, ''))
    WHERE display_name IS NULL OR display_name = '';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    UPDATE public.profiles
    SET display_name = COALESCE(NULLIF(display_name, ''), NULLIF(username, ''))
    WHERE display_name IS NULL OR display_name = '';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'name'
  ) THEN
    UPDATE public.profiles
    SET display_name = COALESCE(NULLIF(display_name, ''), NULLIF(name, ''))
    WHERE display_name IS NULL OR display_name = '';
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for users who signed up before this schema
INSERT INTO public.profiles (id, email, display_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Drafts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  body TEXT NOT NULL DEFAULT '',
  prompt TEXT DEFAULT '',
  word_goal INTEGER,
  timer_seconds INTEGER DEFAULT 1500,
  word_count INTEGER NOT NULL DEFAULT 0,
  ai_status TEXT NOT NULL DEFAULT 'ai_free'
    CHECK (ai_status IN ('ai_free', 'ai_contributed', 'ai_generated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_user ON public.drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_updated ON public.drafts(user_id, updated_at DESC);

ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own drafts" ON public.drafts;
CREATE POLICY "Users manage own drafts" ON public.drafts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Forum posts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES public.drafts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'withdrawn')),
  ai_status TEXT NOT NULL
    CHECK (ai_status IN ('ai_free', 'ai_contributed', 'ai_generated')),
  feedback_visibility TEXT NOT NULL DEFAULT 'accounts_only'
    CHECK (feedback_visibility IN ('author_only', 'accounts_only', 'public')),
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT published_ai_ok CHECK (
    status != 'published' OR ai_status IN ('ai_free', 'ai_contributed')
  )
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_status ON public.forum_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON public.forum_posts(user_id);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Authors manage own posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Authors insert own posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Authors update own posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Authors delete own posts" ON public.forum_posts;

CREATE POLICY "Anyone can read published posts" ON public.forum_posts
  FOR SELECT USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Authors insert own posts" ON public.forum_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (status != 'published' OR ai_status IN ('ai_free', 'ai_contributed'))
  );

CREATE POLICY "Authors update own posts" ON public.forum_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors delete own posts" ON public.forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Post views (unique per viewer_key)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, viewer_key)
);

CREATE INDEX IF NOT EXISTS idx_post_views_post ON public.post_views(post_id);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert views" ON public.post_views;
DROP POLICY IF EXISTS "Authors read views on own posts" ON public.post_views;

CREATE POLICY "Anyone can insert views" ON public.post_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authors read views on own posts" ON public.post_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id AND p.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.record_post_view(p_post_id UUID, p_viewer_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ai TEXT;
  v_count INTEGER;
  v_inserted INTEGER;
BEGIN
  IF p_viewer_key IS NULL OR length(trim(p_viewer_key)) = 0 THEN
    RETURN 0;
  END IF;

  SELECT ai_status, view_count INTO v_ai, v_count
  FROM public.forum_posts
  WHERE id = p_post_id AND status = 'published';

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_ai = 'ai_generated' THEN
    RETURN v_count;
  END IF;

  INSERT INTO public.post_views (post_id, viewer_user_id, viewer_key)
  VALUES (p_post_id, auth.uid(), p_viewer_key)
  ON CONFLICT (post_id, viewer_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    UPDATE public.forum_posts
    SET view_count = view_count + 1,
        updated_at = NOW()
    WHERE id = p_post_id
    RETURNING view_count INTO v_count;
  ELSE
    SELECT view_count INTO v_count FROM public.forum_posts WHERE id = p_post_id;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_post_view(UUID, TEXT) TO anon, authenticated;

-- ============================================================
-- Forum comments (general + selection / Docs-style)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  anchor_type TEXT NOT NULL CHECK (anchor_type IN ('selection', 'general')),
  start_offset INTEGER,
  end_offset INTEGER,
  quote_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT selection_has_offsets CHECK (
    (anchor_type = 'general' AND start_offset IS NULL AND end_offset IS NULL)
    OR (anchor_type = 'selection' AND start_offset IS NOT NULL AND end_offset IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON public.forum_comments(post_id, created_at);

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read comments by visibility" ON public.forum_comments;
DROP POLICY IF EXISTS "Auth insert comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Delete own or author comments" ON public.forum_comments;

CREATE POLICY "Read comments by visibility" ON public.forum_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id
        AND p.status = 'published'
        AND (
          p.feedback_visibility = 'public'
          OR (p.feedback_visibility = 'accounts_only' AND auth.uid() IS NOT NULL)
          OR (p.feedback_visibility = 'author_only' AND p.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Auth insert comments" ON public.forum_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id
        AND p.status = 'published'
        AND (
          anchor_type = 'general'
          OR (anchor_type = 'selection' AND p.ai_status = 'ai_free')
        )
    )
  );

CREATE POLICY "Delete own or author comments" ON public.forum_comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- Grants (RLS still enforces access)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drafts TO authenticated;

GRANT SELECT ON public.forum_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;

GRANT SELECT, INSERT ON public.post_views TO anon, authenticated;

GRANT SELECT ON public.forum_comments TO anon, authenticated;
GRANT INSERT, DELETE ON public.forum_comments TO authenticated;

-- ============================================================
-- Drop legacy legal-product tables if present
-- ============================================================
DROP TABLE IF EXISTS public.document_payments CASCADE;
DROP TABLE IF EXISTS public.agreements CASCADE;

-- ============================================================
-- Reload PostgREST schema cache (fixes "not found in schema cache")
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Admin + Prompt of the day
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.prompt_of_the_day (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  body TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.prompt_of_the_day (id, body)
VALUES (1, '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.prompt_of_the_day ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read prompt of the day" ON public.prompt_of_the_day;
DROP POLICY IF EXISTS "Admins update prompt of the day" ON public.prompt_of_the_day;
DROP POLICY IF EXISTS "Admins insert prompt of the day" ON public.prompt_of_the_day;

CREATE POLICY "Anyone can read prompt of the day" ON public.prompt_of_the_day
  FOR SELECT USING (true);

CREATE POLICY "Admins update prompt of the day" ON public.prompt_of_the_day
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins insert prompt of the day" ON public.prompt_of_the_day
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

GRANT SELECT ON public.prompt_of_the_day TO anon, authenticated;
GRANT INSERT, UPDATE ON public.prompt_of_the_day TO authenticated;

-- Set yourself as admin after first sign-in:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'you@example.com';
-- Forum boards (subforums) + post board/post_kind columns
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.forum_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL CHECK (kind IN ('genre', 'community')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.forum_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read forum boards" ON public.forum_boards;
CREATE POLICY "Anyone can read forum boards" ON public.forum_boards
  FOR SELECT USING (true);

GRANT SELECT ON public.forum_boards TO anon, authenticated;

INSERT INTO public.forum_boards (slug, name, description, kind, sort_order) VALUES
  ('fiction', 'Fiction', 'General fiction and literary stories.', 'genre', 10),
  ('nonfiction', 'Nonfiction', 'Essays, reportage, and factual writing.', 'genre', 20),
  ('poetry', 'Poetry', 'Poems of any form or length.', 'genre', 30),
  ('drama-screen', 'Drama & Screen', 'Plays, scripts, and screenwriting.', 'genre', 40),
  ('fantasy-scifi', 'Fantasy & Sci-Fi', 'Speculative worlds and futures.', 'genre', 50),
  ('mystery-thriller', 'Mystery & Thriller', 'Crime, suspense, and whodunits.', 'genre', 60),
  ('romance', 'Romance', 'Love stories and relationship-driven work.', 'genre', 70),
  ('horror', 'Horror', 'Scary, uncanny, and dark fiction.', 'genre', 80),
  ('young-adult', 'Young Adult', 'YA fiction and coming-of-age work.', 'genre', 90),
  ('memoir-essays', 'Memoir & Essays', 'Personal narrative and reflective prose.', 'genre', 100),
  ('advice', 'Asking for Advice', 'Get craft feedback, process tips, and second opinions.', 'community', 200),
  ('advertise-work', 'Advertising Work', 'Share links, calls for readers, and project announcements.', 'community', 210),
  ('chit-chat', 'Chit-Chat', 'Casual talk about writing life and the community.', 'community', 220)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  kind = EXCLUDED.kind,
  sort_order = EXCLUDED.sort_order;

ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.forum_boards(id) ON DELETE RESTRICT;

ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS post_kind TEXT NOT NULL DEFAULT 'writing'
    CHECK (post_kind IN ('writing', 'discussion'));

-- Drop old AI publish constraint if present, replace with kind-aware rule
ALTER TABLE public.forum_posts DROP CONSTRAINT IF EXISTS published_ai_ok;
ALTER TABLE public.forum_posts ADD CONSTRAINT published_ai_ok CHECK (
  status != 'published'
  OR post_kind = 'discussion'
  OR ai_status IN ('ai_free', 'ai_contributed')
);

-- Backfill existing posts into Fiction
UPDATE public.forum_posts
SET board_id = (SELECT id FROM public.forum_boards WHERE slug = 'fiction')
WHERE board_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_forum_posts_board
  ON public.forum_posts(board_id, status, created_at DESC);

-- Comments: signed-in users only (explicit)
DROP POLICY IF EXISTS "Auth insert comments" ON public.forum_comments;
CREATE POLICY "Auth insert comments" ON public.forum_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id
        AND p.status = 'published'
        AND (
          anchor_type = 'general'
          OR (
            anchor_type = 'selection'
            AND p.post_kind = 'writing'
            AND p.ai_status = 'ai_free'
          )
        )
    )
  );

NOTIFY pgrst, 'reload schema';
