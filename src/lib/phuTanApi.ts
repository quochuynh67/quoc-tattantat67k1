import supabase, { isSupabaseConfigured } from "./supabaseClient";
import {
  mockAgriculture,
  mockBeautyHealth,
  mockFood,
  mockHealth,
  mockHero,
  mockNews,
  mockNewsletter,
  mockPlaces,
  mockVlogReviews,
} from "../mocks/data";

export const sectionRoutes = {
  news: "/news",
  places: "/places",
  food: "/food",
  beautyHealth: "/beauty-health",
  agriculture: "/agriculture",
  health: "/health",
} as const;

export const fallbackSections = {
  news: mockNews,
  places: mockPlaces,
  food: mockFood,
  beautyHealth: mockBeautyHealth,
  agriculture: mockAgriculture,
  health: mockHealth,
};

const fromContentItem = (row: any) => ({
  id: row.legacy_id || row.id,
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

const fallbackForSection = (section: keyof typeof fallbackSections) => fallbackSections[section] || [];

export async function getHero() {
  if (!isSupabaseConfigured) return mockHero;

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("row_key", "hero")
    .maybeSingle();

  if (error || !data?.value) return mockHero;
  return data.value;
}

export async function getNewsletterConfig() {
  if (!isSupabaseConfigured) return mockNewsletter;

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("row_key", "newsletter")
    .maybeSingle();

  if (error || !data?.value) return mockNewsletter;
  return data.value;
}

export async function getSectionItems(section: keyof typeof fallbackSections, limit?: number) {
  if (!isSupabaseConfigured) {
    const fallback = fallbackForSection(section);
    return limit ? fallback.slice(0, limit) : fallback;
  }

  let query = supabase
    .from("content_items")
    .select("*")
    .eq("section_slug", section)
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("published_date", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    const fallback = fallbackForSection(section);
    return limit ? fallback.slice(0, limit) : fallback;
  }

  return data.map(fromContentItem);
}

export async function getSectionCount(section: keyof typeof fallbackSections) {
  if (!isSupabaseConfigured) return fallbackForSection(section).length;

  const { count, error } = await supabase
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("section_slug", section)
    .eq("is_published", true);

  if (error || typeof count !== "number" || count === 0) {
    return fallbackForSection(section).length;
  }

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

export async function getVlogReviews() {
  if (!isSupabaseConfigured) return mockVlogReviews;

  const { data, error } = await supabase
    .from("vlog_reviews")
    .select("*, vlog_locations(*)")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("time_seconds", { referencedTable: "vlog_locations", ascending: true });

  if (error || !data || data.length === 0) return mockVlogReviews;
  return data.map(normalizeVlog);
}

export async function getVlogReview(id: string | number) {
  const vlogs = await getVlogReviews();
  return vlogs.find((vlog: any) => String(vlog.newsId) === String(id) || String(vlog.id) === String(id));
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
