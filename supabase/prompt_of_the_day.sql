-- Additive migration: admin flag + prompt of the day
-- Run in Supabase SQL Editor (also included at end of schema.sql)

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

-- Make yourself admin (edit the email, then run):
-- UPDATE public.profiles SET is_admin = true WHERE email = 'you@example.com';

NOTIFY pgrst, 'reload schema';
