import { SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseData, DatabaseError } from "@/lib/db/helpers";
import type { Database, ProfileInsert, ProfileRow, ProfileUpdate } from "@/lib/types/db";

type CountableTable = "songs" | "practice_presets" | "ocr_imports" | "song_extractions";

export type ProfileStats = {
  songsCount: number;
  presetsCount: number;
  ocrImportsCount: number;
  extractionsCount: number;
};

function buildDefaultDisplayName(email: string | null): string {
  const rawLocalPart = email?.split("@")[0]?.trim() ?? "";
  const normalized = rawLocalPart.replace(/[^a-zA-Z0-9._-]/g, "");
  if (normalized.length >= 2) {
    return normalized.slice(0, 40);
  }
  return "Musicien";
}

export function createProfileRepository(supabase: SupabaseClient<Database>) {
  async function countRows(tableName: CountableTable): Promise<number> {
    const response = await supabase.from(tableName).select("id", { count: "exact", head: true });
    if (response.error) {
      throw new DatabaseError(
        response.error.code ?? "unknown",
        `Supabase error [${response.error.code ?? "unknown"}]: ${response.error.message}`,
      );
    }
    return response.count ?? 0;
  }

  async function getProfileByUserId(userId: string): Promise<ProfileRow | null> {
    const response = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return assertSupabaseData(response);
  }

  async function createProfile(insert: ProfileInsert): Promise<ProfileRow> {
    const response = await supabase
      .from("profiles")
      .insert(insert)
      .select()
      .single();
    return assertSupabaseData(response);
  }

  async function updateProfile(userId: string, patch: ProfileUpdate): Promise<ProfileRow> {
    const response = await supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", userId)
      .select()
      .single();
    return assertSupabaseData(response);
  }

  async function getOrCreateProfile(params: { userId: string; email: string | null }): Promise<ProfileRow> {
    const existing = await getProfileByUserId(params.userId);
    if (existing) return existing;

    try {
      return await createProfile({
        user_id: params.userId,
        display_name: buildDefaultDisplayName(params.email),
        full_name: null,
      });
    } catch (error) {
      // Handle race condition where profile was created between read and insert.
      if (error instanceof DatabaseError && error.code === "23505") {
        const profile = await getProfileByUserId(params.userId);
        if (profile) return profile;
      }
      throw error;
    }
  }

  async function getProfileStats(): Promise<ProfileStats> {
    const [songsCount, presetsCount, ocrImportsCount, extractionsCount] =
      await Promise.all([
        countRows("songs"),
        countRows("practice_presets"),
        countRows("ocr_imports"),
        countRows("song_extractions"),
      ]);

    return {
      songsCount,
      presetsCount,
      ocrImportsCount,
      extractionsCount,
    };
  }

  return {
    getProfileByUserId,
    createProfile,
    updateProfile,
    getOrCreateProfile,
    getProfileStats,
  };
}
