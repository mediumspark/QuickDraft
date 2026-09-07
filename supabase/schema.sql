-- AQuickDraft writing app schema
-- Run in Supabase SQL editor

-- ============================================================
-- Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;

CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Drafts
-- ============================================================
CREATE TABLE IF NOT EXISTS drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  body TEXT NOT NULL DEFAULT '',
  prompt TEXT DEFAULT '',
  word_goal INTEGER,
  timer_seconds INTEGER DEFAULT 1500,
  word_count INTEGER NOT NULL DEFAULT 0,
  ai_status TEXT NOT NULL DEFAULT 'ai_free'
    CHECK (ai_status IN ('ai_free', 'ai_contributed', 'ai_generated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(user_id);

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own drafts" ON drafts;
CREATE POLICY "Users manage own drafts" ON drafts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Forum posts
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'withdrawn')),
  ai_status TEXT NOT NULL
    CHECK (ai_status IN ('ai_free', 'ai_contributed', 'ai_generated')),
  feedback_visibility TEXT NOT NULL DEFAULT 'accounts_only'
    CHECK (feedback_visibility IN ('author_only', 'accounts_only', 'public')),
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT published_ai_ok CHECK (
    status != 'published' OR ai_status IN ('ai_free', 'ai_contributed')
  )
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_status ON forum_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published posts" ON forum_posts;
DROP POLICY IF EXISTS "Authors manage own posts" ON forum_posts;

CREATE POLICY "Anyone can read published posts" ON forum_posts
  FOR SELECT USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Authors insert own posts" ON forum_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (status != 'published' OR ai_status IN ('ai_free', 'ai_contributed'))
  );

CREATE POLICY "Authors update own posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authors delete own posts" ON forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Post views
-- ============================================================
CREATE TABLE IF NOT EXISTS post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, viewer_key)
);

CREATE INDEX IF NOT EXISTS idx_post_views_post ON post_views(post_id);

ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert views" ON post_views;
DROP POLICY IF EXISTS "Authors read views on own posts" ON post_views;

CREATE POLICY "Anyone can insert views" ON post_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authors read views on own posts" ON post_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forum_posts p
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
  SELECT ai_status, view_count INTO v_ai, v_count
  FROM forum_posts
  WHERE id = p_post_id AND status = 'published';

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_ai = 'ai_generated' THEN
    RETURN v_count;
  END IF;

  INSERT INTO post_views (post_id, viewer_user_id, viewer_key)
  VALUES (p_post_id, auth.uid(), p_viewer_key)
  ON CONFLICT (post_id, viewer_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    UPDATE forum_posts
    SET view_count = view_count + 1
    WHERE id = p_post_id
    RETURNING view_count INTO v_count;
  ELSE
    SELECT view_count INTO v_count FROM forum_posts WHERE id = p_post_id;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_post_view(UUID, TEXT) TO anon, authenticated;

-- ============================================================
-- Forum comments
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  anchor_type TEXT NOT NULL CHECK (anchor_type IN ('selection', 'general')),
  start_offset INTEGER,
  end_offset INTEGER,
  quote_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT selection_has_offsets CHECK (
    (anchor_type = 'general' AND start_offset IS NULL AND end_offset IS NULL)
    OR (anchor_type = 'selection' AND start_offset IS NOT NULL AND end_offset IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id, created_at);

ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read comments by visibility" ON forum_comments;
DROP POLICY IF EXISTS "Auth insert comments" ON forum_comments;
DROP POLICY IF EXISTS "Delete own or author comments" ON forum_comments;

CREATE POLICY "Read comments by visibility" ON forum_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forum_posts p
      WHERE p.id = post_id
        AND p.status = 'published'
        AND (
          p.feedback_visibility = 'public'
          OR (p.feedback_visibility = 'accounts_only' AND auth.uid() IS NOT NULL)
          OR (p.feedback_visibility = 'author_only' AND p.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Auth insert comments" ON forum_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM forum_posts p
      WHERE p.id = post_id
        AND p.status = 'published'
        AND (
          anchor_type = 'general'
          OR (anchor_type = 'selection' AND p.ai_status = 'ai_free')
        )
    )
  );

CREATE POLICY "Delete own or author comments" ON forum_comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM forum_posts p
      WHERE p.id = post_id AND p.user_id = auth.uid()
    )
  );

-- Drop legacy product tables if present
DROP TABLE IF EXISTS document_payments CASCADE;
DROP TABLE IF EXISTS agreements CASCADE;
