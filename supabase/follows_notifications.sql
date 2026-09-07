-- Follows, project watches, and notifications
-- Run in Supabase SQL Editor

-- ============================================================
-- Follow writers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read follows" ON public.user_follows;
DROP POLICY IF EXISTS "Users manage own follows" ON public.user_follows;

CREATE POLICY "Anyone can read follows" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users manage own follows" ON public.user_follows
  FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- ============================================================
-- Watch a shared project (forum post)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_watches (
  watcher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (watcher_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_project_watches_post ON public.project_watches(post_id);

ALTER TABLE public.project_watches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read project watches" ON public.project_watches;
DROP POLICY IF EXISTS "Users manage own project watches" ON public.project_watches;

CREATE POLICY "Anyone can read project watches" ON public.project_watches
  FOR SELECT USING (true);

CREATE POLICY "Users manage own project watches" ON public.project_watches
  FOR ALL
  USING (auth.uid() = watcher_id)
  WITH CHECK (auth.uid() = watcher_id);

-- ============================================================
-- Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_post', 'post_updated')),
  message TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Actors create notifications" ON public.notifications;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Actors create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT SELECT ON public.user_follows TO anon;

GRANT SELECT, INSERT, DELETE ON public.project_watches TO authenticated;
GRANT SELECT ON public.project_watches TO anon;

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

NOTIFY pgrst, 'reload schema';
