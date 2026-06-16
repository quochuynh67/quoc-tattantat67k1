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
  const { data, error } = await supabase
    .from('content_sections')
    .insert(section)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Admin: fetch all sections including hidden ones
export const getSectionsAll = async () => {
  const { data, error } = await supabase
    .from('content_sections').select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (!error) return data;
  // sort_order column may not exist yet — fall back to created_at only
  const { data: d2, error: e2 } = await supabase
    .from('content_sections').select('*')
    .order('created_at', { ascending: true });
  if (e2) throw e2;
  return d2;
};

// Public: only fetch sections that are not hidden
export const getSections = async () => {
  const { data, error } = await supabase
    .from('content_sections').select('*')
    .neq('hide', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (!error) return data;
  // sort_order column may not exist yet — fall back to created_at only
  const { data: d2, error: e2 } = await supabase
    .from('content_sections').select('*')
    .neq('hide', true)
    .order('created_at', { ascending: true });
  if (e2) throw e2;
  return d2;
};

export const updateSectionOrder = async (updates: { id: string; sort_order: number }[]) => {
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase.from('content_sections').update({ sort_order }).eq('id', id)
    )
  );
};

export const toggleSectionHide = async (id: string, hide: boolean) => {
  const { data, error } = await supabase
    .from('content_sections')
    .update({ hide })
    .eq('id', id);
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


// ── AI Agents ─────────────────────────────────────────────────────────────────
// Table schema: id (bigint), agent_key (text, unique), payload (jsonb), content_section_id (FK→content_sections), created_at, updated_at

export const getAiAgents = async () => {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*, content_sections(id, title, slug)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

// Returns full row — for admin use
export const getAiAgentRowBySectionId = async (sectionId: string) => {
  if (!sectionId) return null;
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('content_section_id', sectionId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
};

// Returns the payload object only — for AgentChat use
export const getAiAgentBySectionId = async (sectionId: string) => {
  const row = await getAiAgentRowBySectionId(sectionId);
  return row ? (row.payload ?? null) : null;
};

// Used by AgentChat — two-step lookup (slug → section id → agent payload)
export const getAiAgentBySlug = async (slug: string) => {
  if (!slug) return null;
  const { data: sec } = await supabase
    .from('content_sections')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!sec) return null;
  return getAiAgentBySectionId(sec.id);
};

export const upsertAiAgent = async (agentData: {
  id?: number;
  content_section_id: string;
  value: { name: string; greeting: string; color: string; emoji: string };
}) => {
  if (agentData.id) {
    const { data, error } = await supabase
      .from('ai_agents')
      .update({
        content_section_id: agentData.content_section_id,
        payload: agentData.value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentData.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('ai_agents')
    .insert({
      agent_key: agentData.content_section_id,
      content_section_id: agentData.content_section_id,
      payload: agentData.value,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAiAgent = async (id: string) => {
  const { error } = await supabase.from('ai_agents').delete().eq('id', id);
  if (error) throw error;
};

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
  // Use upsert to replace the entire row (PUT semantics)
  const payload = { id, ...updates };
  const { data, error } = await supabase
    .from('content_items')
    .upsert([payload], { returning: 'representation', onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) {
    if (error.code === 'PGRST116') {
      // No row found (unlikely with upsert)
      return null;
    }
    throw error;
  }
  return data;
};

export const deletePost = async (id) => {
  const { data, error } = await supabase.from('content_items').delete().eq('id', id);
  if (error) throw error;
  return data;
};

export const getVlogByPost = async (postId) => {
  const { data, error } = await supabase
    .from('vlog_reviews')
    .select('*, vlog_locations(*)')
    .eq('content_item_id', postId)
    .maybeSingle();
  if (error) {
    // If no vlog exists, Supabase returns a 406 error which we treat as null
    if (error.code === 'PGRST116' || error.status === 406) {
      return null;
    }
    throw error;
  }
  return data;
};



// Vlog helper functions
export const getVlogs = async () => {
  const { data, error } = await supabase
    .from('vlog_reviews')
    .select('*, vlog_locations(*)')
    .order('updated_at', { ascending: false });
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
  // Use upsert to replace the entire vlog row (PUT semantics)
  const payload = { id, ...updates };
  const { data, error } = await supabase
    .from('vlog_reviews')
    .upsert([payload], { returning: 'representation', onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) {
    if (error.code === 'PGRST116') {
      // No row found; treat as null
      return null;
    }
    throw error;
  }

  // Replace locations: delete existing then insert new ones
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

export const uploadVlogFile = async (file) => {
  // Reuse existing uploadVideoForVlog logic to upload video files for Vlogs
  return await uploadVideoForVlog(file);
};

export const uploadPostVideo = async (file) => {
  // Alias for uploading post related videos, reuse existing logic
  return await uploadVideoForVlog(file);
};

// Existing uploadVideoForVlog function
export const uploadVideoForVlog = async (file) => {
  // Ensure bucket exists (vlogs-posts) and upload to 'videos' folder
  try {
    await supabase.storage.createBucket('vlogs-posts', { public: true });
  } catch (e) {
    // ignore if bucket already exists
  }
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `videos/${fileName}`;
  const { data, error } = await supabase.storage.from('vlogs-posts').upload(filePath, file);
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage.from('vlogs-posts').getPublicUrl(filePath);
  return publicUrlData.publicUrl;
};

export const uploadTimelineImage = async (file) => {
  try {
    await supabase.storage.createBucket('vlogs-posts', { public: true });
  } catch (e) {
    // ignore if bucket already exists
  }
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `images/timeline-stages/${fileName}`;
  const { data, error } = await supabase.storage.from('vlogs-posts').upload(filePath, file);
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage.from('vlogs-posts').getPublicUrl(filePath);
  return publicUrlData.publicUrl;
};

// Upload entire HLS folder
// Visitor counter
export const getVisitorCount = async (): Promise<number> => {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('row_key', 'visitor_count')
    .maybeSingle();
  return data ? Number(data.value) : 0;
};

export const incrementVisitorCount = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('increment_visitor_count');
  if (error) {
    // Fall back to just reading if RPC not deployed yet
    return getVisitorCount();
  }
  return Number(data) || 0;
};

export const uploadHlsFolder = async (files, onProgress) => {
  try {
    await supabase.storage.createBucket('vlogs-posts', { public: true });
  } catch (e) {
    // ignore
  }

  const folderName = `hls-${Date.now()}`;
  let m3u8Url = '';
  let uploaded = 0;
  const total = files.length;
  const fileArray = Array.from(files);
  const chunkSize = 5;

  for (let i = 0; i < fileArray.length; i += chunkSize) {
    const chunk = fileArray.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (file) => {
      const relativePath = file.webkitRelativePath || file.name;
      const filePath = `videos/${folderName}/${relativePath}`;
      const { error } = await supabase.storage.from('vlogs-posts').upload(filePath, file);
      if (error) throw error;

      uploaded++;
      if (onProgress) onProgress(uploaded, total);

      if (file.name.endsWith('.m3u8')) {
        const { data: publicUrlData } = supabase.storage.from('vlogs-posts').getPublicUrl(filePath);
        m3u8Url = publicUrlData.publicUrl;
      }
    }));
  }

  if (!m3u8Url) {
    throw new Error('Không tìm thấy file .m3u8 trong thư mục!');
  }

  return m3u8Url;
};
