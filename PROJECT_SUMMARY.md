# Tất tần tật – Phú Tân: Project Summary

> Cổng thông tin địa phương huyện Phú Tân, An Giang — tin tức, du lịch, ẩm thực, nông nghiệp, hỗ trợ cộng đồng, vlog review có bản đồ tương tác, và hệ thống giao dịch nông sản riêng biệt.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, MUI v9 + Emotion, React Router v6 |
| Maps | Leaflet + React-Leaflet v4 |
| Charts | Recharts |
| Rich text | React Quill |
| Backend / DB | Supabase (PostgreSQL + RLS + Storage + Auth) |
| AI | Google Gemini (streaming SSE, multi-model fallback: `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-pro`) + Claude Haiku (via Supabase Edge Function proxy) |
| Hosting | Firebase Hosting |
| SEO | react-helmet-async |

---

## 2. Routes & Pages

### Public

| Route | Component | Mô tả |
|---|---|---|
| `/` | `Home.jsx` | Hero banner, content sections, Vlogs map, AI chat, newsletter |
| `/vlogs` | `VlogFeed.jsx` | TikTok-style vertical vlog feed + map view + category filter |
| `/post-detail/:id` | `VlogReview.jsx` | Chi tiết vlog: video player, timeline bản đồ tương tác, side content |
| `/news` | `SectionList.jsx` | Tin tức |
| `/places` | `SectionList.jsx` | Địa điểm du lịch |
| `/food` | `SectionList.jsx` | Ẩm thực |
| `/beauty-health` | `SectionList.jsx` | Làm đẹp & sức khỏe |
| `/agriculture` | `SectionList.jsx` | Nông nghiệp |
| `/health` | `SectionList.jsx` | Y tế |
| `/detail/:id` | `DetailPage.jsx` | Chi tiết bài viết generic |
| `/submit` | `GuestSubmit.jsx` | Guest upload vlog/post (xác thực số điện thoại) |
| `/admin-login` | `AdminLogin.jsx` | Đăng nhập admin |

### Admin (ProtectedAdminRoute)

| Route | Component | Mô tả |
|---|---|---|
| `/admin/dashboard` | `AdminDashboard.jsx` | Thống kê bài/vlog theo section, biểu đồ bar/pie, lọc theo thời gian |
| `/admin/sections` | `Sections.jsx` | CRUD content sections, drag-and-drop sort, show/hide |
| `/admin/posts` | `Posts.jsx` | CRUD bài viết (rich text Quill), duyệt guest posts |
| `/admin/vlogs` | `Vlogs.jsx` | CRUD vlog, upload HLS video, timeline stages, categories, duyệt guest vlogs |
| `/admin/ai-agents` | `AiAgents.jsx` | Cấu hình AI agent per section (name, greeting, emoji, color) |
| `/admin/settings` | `Settings.jsx` | Hero banner, feature flags, admin delete password |

### Trading Module (auth riêng biệt — ProtectedTradingRoute)

| Route | Component | Mô tả |
|---|---|---|
| `/trading-login` | `TradingLogin.jsx` | Đăng nhập trading module |
| `/trading` | `Dashboard.jsx` | Doanh thu: area charts, P&L theo sản phẩm, lọc ngày |
| `/trading/farmers` | `Farmers.jsx` | Quản lý nông dân (liên hệ, lịch sử giao dịch) |
| `/trading/purchases` | `Purchases.jsx` | Đơn mua từ nông dân (items JSONB, status) |
| `/trading/sales` | `Sales.jsx` | Hóa đơn bán cho khách |
| `/trading/customers` | `Customers.jsx` | Quản lý khách hàng (loại: lẻ / sỉ) |
| `/trading/products` | `Products.jsx` | Danh mục sản phẩm nông sản |

---

## 3. Features

### User-facing

- **Trang chủ động** — thứ tự sections lấy từ DB, feature flags ẩn/hiện toàn bộ module
- **VlogFeed** — cuộn dọc kiểu TikTok, auto-next, tap to pause/play, always-mounted để giữ video DOM state
- **Vlog map view** — chuyển scroll ↔ bản đồ; markers thumbnail + emoji badge theo category; filter chips có badge số lượng; vlog không có location hiện tại tâm Phú Tân; popup dark glass
- **VlogsMapSection** (trang chủ) — same marker style; floating category chips overlay; user geolocation; sort by distance
- **Content sections** — mỗi section có list view + AI chat agent riêng
- **AI Chat agents** — Gemini streaming, model rotation khi fail, rate limiting 1 phút, persona Miền Nam, system prompt restrict theo topic section
- **Community Help Requests** — submit yêu cầu (title, urgency, category, location, ảnh); đăng ký tình nguyện (money/labor/time/goods); đếm volunteers qua DB trigger
- **Newsletter subscription** — email capture lưu vào DB
- **Visitor counter** — atomic increment qua PostgreSQL RPC `security definer`
- **Guest Submission** — upload vlog/post không cần tài khoản, xác thực SĐT, hỗ trợ HLS upload chunked 5 files/batch, timeline stages có tọa độ, vlog categories
- **Dark/light theme** — custom ThemeProvider hook
- **SEO** — per-page meta tags qua react-helmet-async

### Admin

- **Content management** — full CRUD sections, posts, vlogs
- **Guest content review** — duyệt pending guest posts/vlogs, approve (move files từ guest bucket → main) hoặc reject (xóa guest files)
- **Vlog timeline stages** — thêm time-stamped location stages (name, note, image, lat/lng), images upload lên Supabase Storage
- **HLS video** — upload toàn bộ HLS folder (m3u8 + .ts segments), chunked 5 files/batch
- **Vlog categories** — CRUD (slug, name, color, description, order); gán per vlog
- **AI agent config** — bind Gemini agent theo section; tuỳ chỉnh name, greeting, emoji, color
- **Dashboard analytics** — post counts by section, bar chart, pie chart, time period filters
- **Hero settings** — image URL, title, subtitle, description lưu JSONB trong `site_settings`
- **Feature flags** — `can_chat_with_ai`, `can_explore`, `show_other_tab`
- **Cache invalidation** — admin save/delete → `clearVlogCache()` + `refreshVlogs()` bust module cache + VlogCacheContext ngay trong session

### Trading Module

- Quản lý nông dân, khách hàng (lẻ/sỉ), sản phẩm nông sản
- Đơn mua / hóa đơn bán (items dạng JSONB array)
- Dashboard doanh thu: area charts, P&L theo sản phẩm, lọc theo khoảng ngày
- Upload ảnh nông dân/khách hàng lên `trading` Storage bucket

---

## 4. Database Tables

### Content & Settings

```sql
site_settings
  row_key   TEXT PRIMARY KEY
  value     JSONB
  -- keys: hero, visitor_count, newsletter,
  --       can_chat_with_ai, can_explore, show_other_tab

content_sections
  id             UUID PRIMARY KEY
  slug           TEXT UNIQUE
  title          TEXT
  description    TEXT
  route          TEXT
  display_order  INT
  sort_order     INT
  is_active      BOOL
  hide           BOOL

content_items
  id              UUID PRIMARY KEY
  legacy_id       INT
  section_slug    TEXT  → content_sections.slug
  title           TEXT
  excerpt         TEXT
  description     TEXT
  content         TEXT  (rich HTML)
  image_url       TEXT
  category        TEXT
  address         TEXT
  rating          NUMERIC(2,1)
  severity        TEXT
  published_date  DATE
  metadata        JSONB
  display_order   INT
  is_published    BOOL
  hide            BOOL
  uploader_phone  TEXT
```

### Vlog

```sql
vlog_categories
  id             SERIAL PRIMARY KEY
  slug           TEXT UNIQUE        -- 'chill' | 'real-estate' | 'helps' | 'news'
  name           TEXT               -- 'Chill' | 'Bất động sản' | 'Hỗ trợ' | 'Tin tức'
  color          TEXT               -- '#10b981' | '#3b82f6' | '#f59e0b' | '#ef4444'
  description    TEXT
  display_order  INT

vlog_reviews
  id              UUID PRIMARY KEY
  legacy_id       INT UNIQUE
  news_legacy_id  INT
  content_item_id UUID  → content_items.id
  title           TEXT
  subtitle        TEXT
  video_url       TEXT
  poster_url      TEXT
  host            TEXT
  duration_label  TEXT
  is_published    BOOL
  display_order   INT
  uploader_phone  TEXT
  category_slug   TEXT  → vlog_categories.slug  ON DELETE SET NULL

vlog_locations
  id              UUID PRIMARY KEY
  vlog_review_id  UUID  → vlog_reviews.id  ON DELETE CASCADE
  time_seconds    INT
  name            TEXT
  note            TEXT
  image_url       TEXT
  latitude        NUMERIC(10,7)
  longitude       NUMERIC(10,7)
  display_order   INT

-- Guest submissions (pending approval)
vlog_reviews_guest     -- như vlog_reviews + locations_json JSONB, submitted_at, is_approved
content_items_guest    -- như content_items + submitted_at
```

### Community

```sql
requests
  id               BIGINT PRIMARY KEY
  title            TEXT
  urgency          TEXT  -- 'urgent' | 'medium' | 'normal'
  category         TEXT
  description      TEXT
  location         TEXT
  latitude         NUMERIC
  longitude        NUMERIC
  contact_name     TEXT
  contact_phone    TEXT
  images           TEXT[]
  status           TEXT  -- 'pending' | 'in_progress' | 'completed' | 'closed'
  volunteers_count INT   -- auto-increment qua DB trigger

volunteers
  id            BIGINT PRIMARY KEY
  request_id    BIGINT  → requests.id  ON DELETE CASCADE
  name          TEXT
  phone         TEXT
  support_type  TEXT  -- 'money' | 'labor' | 'time' | 'goods'
  description   TEXT

newsletter_subscribers
  id         UUID PRIMARY KEY
  email      TEXT UNIQUE
  source     TEXT
  is_active  BOOL

ai_agents
  id                 BIGINT PRIMARY KEY
  agent_key          TEXT UNIQUE
  content_section_id UUID  → content_sections.id
  payload            JSONB  -- { name, greeting, color, emoji }

admin_settings
  row_key  TEXT PRIMARY KEY
  value    TEXT
  -- keys: admin_delete_password
```

### Trading (full RLS — scoped by user_id = auth.uid())

```sql
trading_farmers    -- id, user_id, name, phone, address
trading_customers  -- id, user_id, name, phone, address, type ('le' | 'si')
trading_products   -- id, user_id, name
trading_purchases  -- id, user_id, farmer_id FK, items JSONB, total_amount, paid_amount, status
trading_sales      -- id, user_id, customer_id FK, items JSONB, total_amount, paid_amount, status
```

### Storage Buckets

| Bucket | Access | Nội dung |
|---|---|---|
| `vlogs-posts` | Admin/authenticated | Video HLS folders, images/posts, images/posters, images/timeline-stages |
| `vlogs-posts-guest` | Guest write, Admin read/delete | Guest submissions (admin move to main on approval) |
| `request-photos` | Public read/write/delete | Ảnh community help requests |
| `trading` | Authenticated only | Ảnh nông dân, khách hàng |

---

## 5. API & Data Patterns

### Hai lớp API

**`supabaseClient.ts`** — raw Supabase CRUD, dùng bởi admin pages và guest submit. Không có caching.

**`phuTanApi.ts`** — normalized public-facing API với module-level cache:
- `_vlogCache` — TTL 5 phút, export `clearVlogCache()` + `isVlogCacheValid()`
- `_sectionCache` — Map theo section slug + limit key, TTL 5 phút
- `normalizeVlog()` — convert snake_case → camelCase, join `vlog_locations` → `locations[]`, join `vlog_categories` → `category`

### Supabase FK Join
```ts
.select("*, vlog_locations(*), vlog_categories(slug, name, color)")
```

### VlogCacheContext
- Cache vlogs + UI state (scroll position, visible index, sheet height, hasInteracted) in-memory
- `ensureLoaded()` — fetch once, skip nếu đã có data
- `refreshVlogs()` — force re-fetch (dùng sau admin save/delete)
- Admin save/delete: `clearVlogCache()` + `refreshVlogs()` để bust cache ngay trong session

### AI Chat
- `agentApi.ts` — Gemini streaming (SSE), model rotation sau N lần fail, rate limiting 1 phút client-side
- Hai-bước lookup: section slug → `content_sections.id` → `ai_agents.payload`
- System prompt: persona Miền Nam, restrict theo topic section
- Claude Haiku qua Supabase Edge Function proxy (`/functions/v1/claude-proxy`)

### RLS Pattern
- Public tables: `SELECT` policy `USING (true)` hoặc `USING (is_published = true)`
- Guest INSERT: allowed với phone validation
- Admin: `ALL` policy cho authenticated users
- Trading: `ALL` policy `USING (auth.uid() = user_id)` — fully isolated per user

---

## 6. Architecture Decisions

### Always-mounted Pages
`Home` và `VlogFeed` luôn trong DOM (`display: none` khi inactive). Lý do: giữ React state — đặc biệt video element positions và playback state của VlogFeed giữa các navigation.

### VlogCacheContext
Single shared cache cho vlog data + UI state. Ngăn re-fetch và scroll-jump khi navigate back từ detail page. Always-mounted pattern của VlogFeed là điều kiện để context này hoạt động.

### Guest → Admin Approval Flow
```
Guest submit
  → *_guest tables + vlogs-posts-guest bucket
  → Admin review trong /admin/vlogs
  → Approve: move files (download → upload → delete), tạo canonical record trong vlog_reviews
  → Reject: xóa guest files
```

### Map Overlay Pattern (React-Leaflet v4)
UI overlays (category chips, buttons) đặt **ngoài** `<MapContainer>` — là absolute-positioned children của shell div. KHÔNG đặt bên trong `<MapContainer>` trừ khi component dùng `useMap()` hook. Vi phạm rule này → black screen / map bị cover.

### HLS Video Upload
```
Guest/Admin chọn HLS folder
  → Upload chunked (5 files parallel)
  → m3u8 + .ts segments → Supabase Storage
  → video_url = public URL của .m3u8 file
```

### Feature Flags
`site_settings` table keys toggle:
- `can_chat_with_ai` — AI chat visibility
- `can_explore` — explore features
- `show_other_tab` — tab rendering

Đọc qua `SiteSettingsProvider`, render conditional toàn bộ module.

### Trading Isolation
Hoàn toàn tách biệt — Supabase Auth riêng, tables riêng với user_id RLS, storage bucket riêng, route group riêng, zero coupling với content system.

### Gemini Model Fallback
```
Request → gemini-2.5-flash
  → fail N times → rotate to gemini-2.0-flash
  → fail N times → rotate to gemini-pro
  → 429 response → rate limit delay từ header
```

---

## 7. Key Files

```
src/
├── App.jsx                          # Routes, always-mounted layout, VlogCacheProvider
├── lib/
│   ├── supabaseClient.ts            # Raw Supabase CRUD + file uploads
│   └── phuTanApi.ts                 # Normalized public API + module cache
├── contexts/
│   └── VlogCacheContext.jsx         # Vlog data + UI state cache
├── pages/
│   ├── Home.jsx                     # Homepage
│   ├── VlogFeed.jsx                 # TikTok vlog feed + map
│   ├── VlogReview.jsx               # Vlog detail + timeline map
│   ├── GuestSubmit.jsx              # Guest upload
│   ├── SectionList.jsx              # Content listing
│   ├── DetailPage.jsx               # Content detail
│   └── admin/
│       ├── Vlogs.jsx                # Vlog + category management
│       ├── Posts.jsx                # Content management
│       ├── Sections.jsx             # Section management
│       ├── AiAgents.jsx             # AI agent config
│       ├── Dashboard.jsx            # Analytics
│       └── Settings.jsx             # Site settings
├── components/
│   └── sections/
│       └── VlogsMapSection.jsx      # Homepage vlog map
├── styles/
│   └── global.css                   # Vlog UI, map popups, markers
└── supabase/
    └── vlog_category_migration.sql  # vlog_categories table + category_slug columns
```
