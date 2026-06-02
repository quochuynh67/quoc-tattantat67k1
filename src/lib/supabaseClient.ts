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
