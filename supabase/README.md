# Supabase setup

Use the same Supabase project config followed from `phu-tan-help.html`.

## Environment

Create `.env.local` for local development if you want to override the built-in fallback config:

```bash
VITE_SUPABASE_URL=https://qwgqgqdtgwkqcbosyqtl.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

## SQL order

Run these files in Supabase SQL Editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/seed_content.sql`

`schema.sql` creates:

- `site_settings`
- `content_sections`
- `content_items`
- `vlog_reviews`
- `vlog_locations`
- `newsletter_subscribers`
- `requests`
- `volunteers`
- `admin_settings`
- storage bucket `request-photos`

`seed.sql` adds the core section metadata, hero/newsletter config, and the admin delete password placeholder.

`seed_content.sql` adds all homepage/list items and vlog timestamp locations so the app can render from Supabase immediately.

## Frontend query layer

The frontend service layer is in `src/lib/phuTanApi.ts`.

It includes:

- content section queries with mock fallback
- hero/newsletter config queries
- vlog review and timestamp location queries
- newsletter subscription insert
- help request CRUD helpers
- request photo upload helpers
- volunteer insert helpers
- admin delete password lookup
