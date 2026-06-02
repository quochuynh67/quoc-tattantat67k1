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
