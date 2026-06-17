-- Migration: Guest submission support
-- Run in Supabase SQL editor

-- 1. Add hide column to content_items (if not already added)
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS hide boolean NOT NULL DEFAULT false;

-- 2. Add uploader_phone to content_items
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS uploader_phone text;

-- 3. Add uploader_phone to vlog_reviews
ALTER TABLE public.vlog_reviews ADD COLUMN IF NOT EXISTS uploader_phone text;

-- 4. Allow authenticated users (admin) to fully manage content
DROP POLICY IF EXISTS "Authenticated can manage content_items" ON public.content_items;
CREATE POLICY "Authenticated can manage content_items" ON public.content_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage vlog_reviews" ON public.vlog_reviews;
CREATE POLICY "Authenticated can manage vlog_reviews" ON public.vlog_reviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage vlog_locations" ON public.vlog_locations;
CREATE POLICY "Authenticated can manage vlog_locations" ON public.vlog_locations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Allow anonymous (guest) to insert a post (must hide=true + phone provided)
DROP POLICY IF EXISTS "Guest can submit post" ON public.content_items;
CREATE POLICY "Guest can submit post" ON public.content_items
  FOR INSERT TO anon WITH CHECK (
    uploader_phone IS NOT NULL AND uploader_phone != '' AND hide = true
  );

-- 6. Allow anonymous (guest) to insert a vlog (must is_published=false + phone provided)
DROP POLICY IF EXISTS "Guest can submit vlog" ON public.vlog_reviews;
CREATE POLICY "Guest can submit vlog" ON public.vlog_reviews
  FOR INSERT TO anon WITH CHECK (
    uploader_phone IS NOT NULL AND uploader_phone != '' AND is_published = false
  );

-- 7. Allow guest (anon) to upload images to vlogs-posts bucket under images/posts/
DROP POLICY IF EXISTS "Guest can upload post images" ON storage.objects;
CREATE POLICY "Guest can upload post images" ON storage.objects
  FOR INSERT TO anon WITH CHECK (
    bucket_id = 'vlogs-posts' AND (storage.foldername(name))[1] = 'images'
  );

-- Allow public to read all files in vlogs-posts (images are public)
DROP POLICY IF EXISTS "Public can read vlogs-posts files" ON storage.objects;
CREATE POLICY "Public can read vlogs-posts files" ON storage.objects
  FOR SELECT USING (bucket_id = 'vlogs-posts');
