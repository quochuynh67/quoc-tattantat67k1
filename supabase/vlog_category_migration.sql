-- Migration: Vlog Categories
-- Tạo bảng quản lý danh mục vlog và thêm field category_slug vào vlog_reviews

-- 1. Tạo bảng vlog_categories
CREATE TABLE IF NOT EXISTS vlog_categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#1976d2',
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed danh mục mặc định
INSERT INTO vlog_categories (slug, name, color, description, display_order) VALUES
  ('chill',       'Chill',         '#10b981', 'Video thư giãn, giải trí, khám phá',    1),
  ('real-estate', 'Bất động sản',  '#3b82f6', 'Video về bất động sản, nhà đất Phú Tân', 2),
  ('helps',       'Hỗ trợ',        '#f59e0b', 'Video hướng dẫn, hỗ trợ cộng đồng',     3),
  ('news',        'Tin tức',       '#ef4444', 'Video tin tức, thời sự địa phương',      4)
ON CONFLICT (slug) DO NOTHING;

-- 3. Thêm cột category_slug vào bảng vlog_reviews
ALTER TABLE vlog_reviews
  ADD COLUMN IF NOT EXISTS category_slug TEXT REFERENCES vlog_categories(slug) ON DELETE SET NULL;

-- 4. Thêm cột category_slug vào bảng vlog_reviews_guest (dành cho guest submit)
ALTER TABLE vlog_reviews_guest
  ADD COLUMN IF NOT EXISTS category_slug TEXT REFERENCES vlog_categories(slug) ON DELETE SET NULL;

-- 5. Index để lọc nhanh theo category
CREATE INDEX IF NOT EXISTS idx_vlog_reviews_category ON vlog_reviews(category_slug);
