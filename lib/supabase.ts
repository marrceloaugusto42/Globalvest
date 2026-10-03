import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mbmmdxqbwrjcnklbmogr.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_sQfBJtUT3TWDonu3Eo77KQ_MSVbq0uz";

let client: SupabaseClient | null = null;
export function getSupabase() {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
