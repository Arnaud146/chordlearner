import { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  SongExtractionInsert,
  SongExtractionRow,
  SongExtractionUpdate,
} from "@/lib/types/db";
import { assertSupabaseData } from "@/lib/db/helpers";

export function createSongExtractionRepository(supabase: SupabaseClient<Database>) {
  return {
    async createSongExtraction(input: SongExtractionInsert): Promise<SongExtractionRow> {
      const res = await supabase
        .from("song_extractions")
        .insert(input)
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async updateSongExtraction(
      id: string,
      patch: SongExtractionUpdate,
    ): Promise<SongExtractionRow> {
      const res = await supabase
        .from("song_extractions")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async listSongExtractionsBySong(songId: string): Promise<SongExtractionRow[]> {
      const res = await supabase
        .from("song_extractions")
        .select("*")
        .eq("song_id", songId)
        .order("created_at", { ascending: false });
      return assertSupabaseData(res);
    },
  };
}
