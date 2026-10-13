import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cclyccbzupmdlthvxayp.supabase.co";
const SUPABASE_KEY = "sb_publishable_bzr8MMjZ8-DXegs8MEpkvQ_Jgk5dd4F";

let client: SupabaseClient | null = null;
export function getSupabase() {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
