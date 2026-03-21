import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/db";

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function createAdminClient() {
  return createClient<Database>(
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
