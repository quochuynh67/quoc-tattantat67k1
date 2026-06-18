-- Migration: Guest bucket + RLS policies for guest submissions
-- Run in Supabase SQL editor

-- 1. Create vlog_reviews_guest table (if not exists)
CREATE TABLE IF NOT EXISTS public.vlog_reviews_guest (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  subtitle        text,
  video_url       text,
  poster_url      text,
  host            text,
  duration_label  text,
  content_item_id uuid REFERENCES public.content_items(id) ON DELETE SET NULL,
  uploader_phone  text NOT NULL,
  locations_json  jsonb DEFAULT '[]'::jsonb,
  submitted_at    timestamptz DEFAULT now()
);

ALTER TABLE public.vlog_reviews_guest ENABLE ROW LEVEL SECURITY;

-- 2. Create content_items_guest table (if not exists)
CREATE TABLE IF NOT EXISTS public.content_items_guest (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  section_slug   text,
  excerpt        text,
  description    text,
  image_url      text,
  uploader_phone text NOT NULL,
  published_date date,
  submitted_at   timestamptz DEFAULT now()
);

ALTER TABLE public.content_items_guest ENABLE ROW LEVEL SECURITY;

-- 3. RLS: Allow anonymous (guest) to INSERT into vlog_reviews_guest
DROP POLICY IF EXISTS "Guest can submit to vlog_reviews_guest" ON public.vlog_reviews_guest;
CREATE POLICY "Guest can submit to vlog_reviews_guest"
  ON public.vlog_reviews_guest
  FOR INSERT TO anon
  WITH CHECK (uploader_phone IS NOT NULL AND uploader_phone != '');

-- 4. RLS: Allow authenticated (admin) to fully manage vlog_reviews_guest
DROP POLICY IF EXISTS "Authenticated can manage vlog_reviews_guest" ON public.vlog_reviews_guest;
CREATE POLICY "Authenticated can manage vlog_reviews_guest"
  ON public.vlog_reviews_guest
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 5. RLS: Allow anonymous (guest) to INSERT into content_items_guest
DROP POLICY IF EXISTS "Guest can submit to content_items_guest" ON public.content_items_guest;
CREATE POLICY "Guest can submit to content_items_guest"
  ON public.content_items_guest
  FOR INSERT TO anon
  WITH CHECK (uploader_phone IS NOT NULL AND uploader_phone != '');

-- 6. RLS: Allow authenticated (admin) to fully manage content_items_guest
DROP POLICY IF EXISTS "Authenticated can manage content_items_guest" ON public.content_items_guest;
CREATE POLICY "Authenticated can manage content_items_guest"
  ON public.content_items_guest
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 7. Create vlogs-posts-guest bucket (public for reading)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vlogs-posts-guest', 'vlogs-posts-guest', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 8. RLS: Allow anonymous to upload ANY file into vlogs-posts-guest
DROP POLICY IF EXISTS "Guest can upload to vlogs-posts-guest" ON storage.objects;
CREATE POLICY "Guest can upload to vlogs-posts-guest"
  ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'vlogs-posts-guest');

-- 9. RLS: Allow public to read files in vlogs-posts-guest
DROP POLICY IF EXISTS "Public can read vlogs-posts-guest" ON storage.objects;
CREATE POLICY "Public can read vlogs-posts-guest"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vlogs-posts-guest');

-- 10. RLS: Allow authenticated (admin) to manage (delete/update) files in vlogs-posts-guest
DROP POLICY IF EXISTS "Authenticated can manage vlogs-posts-guest" ON storage.objects;
CREATE POLICY "Authenticated can manage vlogs-posts-guest"
  ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'vlogs-posts-guest')
  WITH CHECK (bucket_id = 'vlogs-posts-guest');

-- 11. RLS: Allow authenticated (admin) to manage files in vlogs-posts (for moveGuestFileToMain)
DROP POLICY IF EXISTS "Authenticated can manage vlogs-posts" ON storage.objects;
CREATE POLICY "Authenticated can manage vlogs-posts"
  ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'vlogs-posts')
  WITH CHECK (bucket_id = 'vlogs-posts');
