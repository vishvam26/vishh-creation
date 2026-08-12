import { createClient } from "@supabase/supabase-js";

export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return Boolean(
    url &&
    url.startsWith("http") &&
    key &&
    key.length > 20 &&
    !key.includes("your-supabase")
  );
};

export const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (url && key && url.startsWith("http")) {
    return createClient(url, key);
  }
  return null;
};

export const supabase = getSupabase();
