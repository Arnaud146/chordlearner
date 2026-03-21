import { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  ChordOccurrenceInsert,
  ChordOccurrenceRow,
  UniqueChordInsert,
  UniqueChordRow,
} from "@/lib/types/db";
import { assertSupabaseData } from "@/lib/db/helpers";

export function createChordRepository(supabase: SupabaseClient<Database>) {
  return {
    /**
     * Delete all existing chord occurrences for a song, then bulk insert.
     * Used after parsing / re-parsing a chord sheet.
     */
    async replaceChordOccurrencesForSong(
      songId: string,
      rows: ChordOccurrenceInsert[],
    ): Promise<ChordOccurrenceRow[]> {
      const delRes = await supabase
        .from("chord_occurrences")
        .delete()
        .eq("song_id", songId);
      if (delRes.error) {
        throw new Error(
          `Supabase error [${delRes.error.code}]: ${delRes.error.message}`,
        );
      }

      if (rows.length === 0) return [];

      const insRes = await supabase
        .from("chord_occurrences")
        .insert(rows)
        .select();
      return assertSupabaseData(insRes);
    },

    /**
     * Delete all existing unique chords for a song, then bulk insert.
     */
    async replaceUniqueChordsForSong(
      songId: string,
      rows: UniqueChordInsert[],
    ): Promise<UniqueChordRow[]> {
      const delRes = await supabase
        .from("unique_chords")
        .delete()
        .eq("song_id", songId);
      if (delRes.error) {
        throw new Error(
          `Supabase error [${delRes.error.code}]: ${delRes.error.message}`,
        );
      }

      if (rows.length === 0) return [];

      const insRes = await supabase
        .from("unique_chords")
        .insert(rows)
        .select();
      return assertSupabaseData(insRes);
    },

    async getChordOccurrencesBySong(
      songId: string,
    ): Promise<ChordOccurrenceRow[]> {
      const res = await supabase
        .from("chord_occurrences")
        .select("*")
        .eq("song_id", songId)
        .order("line_index")
        .order("token_index");
      return assertSupabaseData(res);
    },

    async getUniqueChordsBySong(songId: string): Promise<UniqueChordRow[]> {
      const res = await supabase
        .from("unique_chords")
        .select("*")
        .eq("song_id", songId)
        .order("normalized_chord_symbol");
      return assertSupabaseData(res);
    },
  };
}
