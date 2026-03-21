import { PostgrestSingleResponse } from "@supabase/supabase-js";

export class DatabaseError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
  }
}

/**
 * Unwrap a Supabase response: return data or throw on error.
 * Use in repositories to avoid repetitive null-checks.
 */
export function assertSupabaseData<T>(
  response: PostgrestSingleResponse<T>,
): T {
  if (response.error) {
    const rawMessage = response.error.message ?? "Erreur inconnue";
    const isNetworkFailure = /fetch failed/i.test(rawMessage);
    const hint = isNetworkFailure
      ? " Verify NEXT_PUBLIC_SUPABASE_URL, keys, and outbound network access."
      : "";
    throw new DatabaseError(
      response.error.code ?? "unknown",
      `Supabase error [${response.error.code ?? "unknown"}]: ${rawMessage}.${hint}`,
    );
  }
  return response.data;
}
