-- ============================================================
-- AQuickDraft: APPLY THIS in Supabase → SQL Editor → Run
-- Creates genre + community boards and links forum_posts.board_id
-- Safe to re-run.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- forum_posts must already exist (from the main writing schema)
ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.forum_boards(id) ON DELETE RESTRICT;

ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS post_kind TEXT NOT NULL DEFAULT 'writing';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forum_posts_post_kind_check'
  ) THEN
    ALTER TABLE public.forum_posts
      ADD CONSTRAINT forum_posts_post_kind_check
      CHECK (post_kind IN ('writing', 'discussion'));
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

ALTER TABLE public.forum_posts DROP CONSTRAINT IF EXISTS published_ai_ok;
ALTER TABLE public.forum_posts ADD CONSTRAINT published_ai_ok CHECK (
  status != 'published'
  OR post_kind = 'discussion'
  OR ai_status IN ('ai_free', 'ai_contributed')
);

UPDATE public.forum_posts
SET board_id = (SELECT id FROM public.forum_boards WHERE slug = 'fiction')
WHERE board_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_forum_posts_board
  ON public.forum_posts(board_id, status, created_at DESC);

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
            AND COALESCE(p.post_kind, 'writing') = 'writing'
            AND p.ai_status = 'ai_free'
          )
        )
    )
  );

-- Force PostgREST to pick up public.forum_boards
NOTIFY pgrst, 'reload schema';
