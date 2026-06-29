import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Defense-in-depth auth check for API route handlers.
 * Call this at the top of every API route handler after creating the Supabase client.
 * Throws if no authenticated user is found.
 */
export async function requireAuth(supabase: SupabaseClient): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthRequiredError();
  }

  return user;
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}
