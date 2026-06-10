import supabase, { isSupabaseConfigured } from "./supabaseClient";

const _sectionCache = new Map<string, { data: any[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function _getCached(key: string): any[] | null {
  const entry = _sectionCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _sectionCache.delete(key); return null; }
  return entry.data;
}
function _setCache(key: string, data: any[]) {
  _sectionCache.set(key, { data, ts: Date.now() });
}

export function getSectionItemsSync(section: string, limit?: number): any[] | null {
  return _getCached(`${section}:${limit ?? "all"}`);
}

export const sectionRoutes = {
  news: "/news",
  places: "/places",
  food: "/food",
  beautyHealth: "/beauty-health",
  agriculture: "/agriculture",
  health: "/health",
} as const;

const fromContentItem = (row: any) => ({
  id: row.id,
  title: row.title,
  name: row.title,
  excerpt: row.excerpt,
  description: row.description || row.excerpt,
  content: row.content,
  image: row.image_url,
  category: row.category,
  address: row.address,
  rating: row.rating ? Number(row.rating) : undefined,
  severity: row.severity,
  date: row.published_date,
  metadata: row.metadata || {},
});

const HERO_LS_KEY = "phutan_hero_v1";
const HERO_LS_TTL = 30 * 60 * 1000; // 30 min

export function getHeroSync(): any | null {
  try {
    const raw = localStorage.getItem(HERO_LS_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > HERO_LS_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getHero() {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("row_key", "hero")
    .maybeSingle();

  if (error || !data?.value) return null;

  try {
    localStorage.setItem(HERO_LS_KEY, JSON.stringify({ data: data.value, ts: Date.now() }));
  } catch {}

  return data.value;
}

export async function getNewsletterConfig() {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("row_key", "newsletter")
    .maybeSingle();

  if (error || !data?.value) return null;
  return data.value;
}

export interface FeatureFlags {
  can_chat_with_ai: boolean;
  can_explore: boolean;
  show_other_tab: boolean;
}

const FEATURE_FLAG_KEYS: (keyof FeatureFlags)[] = ["can_chat_with_ai", "can_explore", "show_other_tab"];
const _featureFlagDefaults: FeatureFlags = { can_chat_with_ai: true, can_explore: true, show_other_tab: true };

export async function getFeatureFlags(): Promise<FeatureFlags> {
  if (!isSupabaseConfigured) return { ..._featureFlagDefaults };
  const { data, error } = await supabase
    .from("site_settings")
    .select("row_key, value")
    .in("row_key", FEATURE_FLAG_KEYS);
  if (error || !data) return { ..._featureFlagDefaults };
  const result = { ..._featureFlagDefaults };
  for (const row of data) {
    if (FEATURE_FLAG_KEYS.includes(row.row_key as keyof FeatureFlags)) {
      (result as any)[row.row_key] = Boolean(row.value);
    }
  }
  return result;
}

export async function getSiteSetting(rowKey: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("row_key", rowKey)
    .maybeSingle();
  if (error || !data) return null;
  return data.value;
}

export async function upsertSiteSetting(rowKey: string, value: Record<string, any>) {
  if (!isSupabaseConfigured) return { error: { message: "Supabase not configured" } };
  return supabase
    .from("site_settings")
    .upsert({ row_key: rowKey, value }, { onConflict: "row_key" });
}

export async function getSectionItems(section: string, limit?: number) {
  if (!isSupabaseConfigured) return [];

  const cacheKey = `${section}:${limit ?? "all"}`;
  const cached = _getCached(cacheKey);
  if (cached) return cached;

  let query = supabase
    .from("content_items")
    .select("*")
    .eq("section_slug", section)
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("published_date", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error || !data || data.length === 0) return [];

  const result = data.map(fromContentItem);
  _setCache(cacheKey, result);
  return result;
}

export async function getSectionCount(section: string) {
  if (!isSupabaseConfigured) return 0;

  const { count, error } = await supabase
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("section_slug", section)
    .eq("is_published", true);

  if (error || typeof count !== "number" || count === 0) return 0;

  return count;
}

const normalizeVlog = (row: any) => ({
  id: row.legacy_id || row.id,
  newsId: row.news_legacy_id || row.content_item_id,
  title: row.title,
  subtitle: row.subtitle,
  videoUrl: row.video_url,
  poster: row.poster_url,
  host: row.host,
  durationLabel: row.duration_label,
  locations: (row.vlog_locations || []).map((location: any) => ({
    time: location.time_seconds,
    name: location.name,
    note: location.note,
    image: location.image_url,
    latitude: location.latitude,
    longitude: location.longitude,
  })),
});

let _vlogCache: { data: any[]; ts: number } | null = null;

export async function getVlogReviews() {
  if (!isSupabaseConfigured) return [];

  if (_vlogCache && Date.now() - _vlogCache.ts < CACHE_TTL) return _vlogCache.data;

  const { data, error } = await supabase
    .from("vlog_reviews")
    .select("*, vlog_locations(*)")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .order("display_order", { ascending: true })
    .order("time_seconds", { referencedTable: "vlog_locations", ascending: true });

  if (error || !data || data.length === 0) return [];
  const result = data.map(normalizeVlog);
  _vlogCache = { data: result, ts: Date.now() };
  return result;
}

export async function getVlogReview(contentItemUuid: string) {
  const vlogs = await getVlogReviews();
  return vlogs.find((vlog: any) =>
    String(vlog.newsId) === contentItemUuid || String(vlog.id) === contentItemUuid
  ) ?? null;
}

export async function getVlogReviewForPost(contentItemId: string) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("vlog_reviews")
    .select("*, vlog_locations(*)")
    .eq("content_item_id", contentItemId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .order("display_order", { ascending: true })
    .order("time_seconds", { referencedTable: "vlog_locations", ascending: true });

  if (error || !data) return [];
  return data.map(normalizeVlog);
}

export async function subscribeNewsletter(email: string) {
  if (!isSupabaseConfigured) {
    return { data: null, error: { code: "supabase_not_configured", message: "Supabase is not configured." } };
  }

  return supabase
    .from("newsletter_subscribers")
    .insert([{ email, source: "homepage" }])
    .select()
    .single();
}

export async function listHelpRequests(filter = "all") {
  if (!isSupabaseConfigured) return { data: [], error: null };

  let query = supabase.from("requests").select("*").order("created_at", { ascending: false });
  if (filter !== "all") query = query.eq("urgency", filter);
  return query;
}

export async function getHelpRequest(id: number) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase is not configured." } };

  return supabase.from("requests").select("*, volunteers(*)").eq("id", id).single();
}

export async function createHelpRequest(payload: any) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase is not configured." } };

  return supabase.from("requests").insert([payload]).select().single();
}

export async function uploadRequestPhotos(requestId: number, files: File[]) {
  if (!isSupabaseConfigured) return [];

  const uploadedUrls: string[] = [];

  for (const [index, file] of files.entries()) {
    const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
    const path = `${requestId}/${Date.now()}_${index}_${safeName}`;
    const { error } = await supabase.storage.from("request-photos").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("request-photos").getPublicUrl(path);
    if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
  }

  if (uploadedUrls.length > 0) {
    await supabase.from("requests").update({ images: uploadedUrls }).eq("id", requestId);
  }

  return uploadedUrls;
}

export async function createVolunteer(payload: {
  request_id: number;
  name: string;
  phone: string;
  support_type: "money" | "labor" | "time" | "goods";
  description: string;
}) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase is not configured." } };

  return supabase.from("volunteers").insert([payload]).select().single();
}

export async function getAdminDeletePassword() {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase is not configured." } };

  return supabase.from("admin_settings").select("value").eq("row_key", "admin_delete_password").single();
}

export async function deleteHelpRequest(id: number) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase is not configured." } };

  await supabase.from("volunteers").delete().eq("request_id", id);
  return supabase.from("requests").delete().eq("id", id);
}
