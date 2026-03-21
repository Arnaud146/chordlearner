import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/db";

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { url, anonKey };
}

export function createClient() {
  const { url, anonKey } = getPublicSupabaseConfig();
  return createBrowserClient<Database>(
    url,
    anonKey,
  );
}
