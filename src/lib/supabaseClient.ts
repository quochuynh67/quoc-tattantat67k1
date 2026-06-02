// src/lib/supabaseClient.ts – singleton Supabase client
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) || "";
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

const isProbablyJwt = (value: string) => value.split(".").length === 3;

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") && isProbablyJwt(SUPABASE_ANON_KEY);

export const supabase = createClient(
  SUPABASE_URL || "https://example.supabase.co",
  SUPABASE_ANON_KEY || "missing.supabase.anon-key"
);

export default supabase;

// Section helper functions
export const createSection = async (section) => {
  const { data, error } = await supabase.from('content_sections').insert(section);
  if (error) throw error;
  return data;
};
  
export const getSections = async () => {
  const { data, error } = await supabase.from('content_sections').select('*');
  if (error) throw error;
  return data;
};


export const deleteSection = async (id) => {
  const { data, error } = await supabase.from('content_sections').delete().eq('id', id);
  if (error) throw error;
  return data;
};

export const updateSection = async (id, updates) => {
  const { data, error } = await supabase.from('content_sections').update(updates).eq('id', id);
  if (error) throw error;
  return data;
};


// Post helper functions
// Post helper functions (now using content_items)
export const getPostsBySection = async (sectionSlug) => {
  const query = sectionSlug
    ? supabase.from('content_items').select('*').eq('section_slug', sectionSlug)
    : supabase.from('content_items').select('*');
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createPost = async (post) => {
  // post should contain title, content, section_slug, etc.
  const { data, error } = await supabase.from('content_items').insert(post);
  if (error) throw error;
  return data;
};

export const updatePost = async (id, updates) => {
  const { data, error } = await supabase.from('content_items').update(updates).eq('id', id);
  if (error) throw error;
  return data;
};

export const deletePost = async (id) => {
  const { data, error } = await supabase.from('content_items').delete().eq('id', id);
  if (error) throw error;
  return data;
};

// Vlog helper functions
export const getVlogs = async () => {
  const { data, error } = await supabase
    .from('vlog_reviews')
    .select('*, vlog_locations(*)');
  if (error) throw error;
  return data || [];
};

export const createVlog = async (vlog, locations = []) => {
  const { data, error } = await supabase
    .from('vlog_reviews')
    .insert(vlog)
    .select()
    .single();
  if (error) throw error;

  if (locations.length > 0 && data) {
    // Strip time_seconds, latitude, longitude and prepare format
    const locationsWithVlogId = locations.map((loc) => ({
      vlog_review_id: data.id,
      time_seconds: Number(loc.time_seconds) || 0,
      name: loc.name || "",
      note: loc.note || null,
      image_url: loc.image_url || null,
      latitude: loc.latitude !== "" && loc.latitude !== null ? Number(loc.latitude) : null,
      longitude: loc.longitude !== "" && loc.longitude !== null ? Number(loc.longitude) : null,
    }));
    const { error: locError } = await supabase
      .from('vlog_locations')
      .insert(locationsWithVlogId);
    if (locError) throw locError;
  }

  return data;
};

export const updateVlog = async (id, updates, locations = []) => {
  const { data, error } = await supabase
    .from('vlog_reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Clear existing locations first and re-insert new ones
  const { error: deleteError } = await supabase
    .from('vlog_locations')
    .delete()
    .eq('vlog_review_id', id);
  if (deleteError) throw deleteError;

  if (locations.length > 0) {
    const locationsWithVlogId = locations.map((loc) => ({
      vlog_review_id: id,
      time_seconds: Number(loc.time_seconds) || 0,
      name: loc.name || "",
      note: loc.note || null,
      image_url: loc.image_url || null,
      latitude: loc.latitude !== "" && loc.latitude !== null ? Number(loc.latitude) : null,
      longitude: loc.longitude !== "" && loc.longitude !== null ? Number(loc.longitude) : null,
    }));
    const { error: locError } = await supabase
      .from('vlog_locations')
      .insert(locationsWithVlogId);
    if (locError) throw locError;
  }

  return data;
};

export const deleteVlog = async (id) => {
  const { data, error } = await supabase
    .from('vlog_reviews')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return data;
};

export const uploadVlogFile = async (file, folder = "vlogs") => {
  // Ensure the bucket vlogs-posts exists
  try {
    await supabase.storage.createBucket("vlogs-posts", { public: true });
  } catch (e) {
    // Ignore if bucket already exists
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("vlogs-posts")
    .upload(filePath, file);

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("vlogs-posts")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
