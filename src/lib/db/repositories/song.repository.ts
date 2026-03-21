import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SongInsert, SongRow, SongUpdate } from "@/lib/types/db";
import { assertSupabaseData } from "@/lib/db/helpers";

export function createSongRepository(supabase: SupabaseClient<Database>) {
  return {
    async listSongs(): Promise<SongRow[]> {
      const res = await supabase
        .from("songs")
        .select("*")
        .order("updated_at", { ascending: false });
      return assertSupabaseData(res);
    },

    async getSongById(songId: string): Promise<SongRow> {
      const res = await supabase
        .from("songs")
        .select("*")
        .eq("id", songId)
        .single();
      return assertSupabaseData(res);
    },

    async createSong(input: SongInsert): Promise<SongRow> {
      const res = await supabase
        .from("songs")
        .insert(input)
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async updateSong(songId: string, patch: SongUpdate): Promise<SongRow> {
      const res = await supabase
        .from("songs")
        .update(patch)
        .eq("id", songId)
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async deleteSong(songId: string): Promise<void> {
      const res = await supabase.from("songs").delete().eq("id", songId);
      if (res.error) {
        throw new Error(
          `Supabase error [${res.error.code}]: ${res.error.message}`,
        );
      }
    },
  };
}
