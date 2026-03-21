import { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  HandMode,
  ChordVoicingOptionInsert,
  ChordVoicingOptionRow,
  UserVoicingSelectionUpsert,
  UserVoicingSelectionRow,
} from "@/lib/types/db";
import { assertSupabaseData } from "@/lib/db/helpers";

export interface VoicingLookupParams {
  songId: string;
  keyContext: string;
  normalizedChordSymbol: string;
  handMode: HandMode;
}

export function createVoicingRepository(supabase: SupabaseClient<Database>) {
  return {
    async listVoicingOptions(
      params: VoicingLookupParams,
    ): Promise<ChordVoicingOptionRow[]> {
      const res = await supabase
        .from("chord_voicing_options")
        .select("*")
        .eq("song_id", params.songId)
        .eq("key_context", params.keyContext)
        .eq("normalized_chord_symbol", params.normalizedChordSymbol)
        .eq("hand_mode", params.handMode)
        .order("inversion_index");
      return assertSupabaseData(res);
    },

    async insertVoicingOptions(
      rows: ChordVoicingOptionInsert[],
    ): Promise<ChordVoicingOptionRow[]> {
      if (rows.length === 0) return [];
      const res = await supabase
        .from("chord_voicing_options")
        .insert(rows)
        .select();
      return assertSupabaseData(res);
    },

    async upsertUserVoicingSelection(
      row: UserVoicingSelectionUpsert,
    ): Promise<UserVoicingSelectionRow> {
      const res = await supabase
        .from("user_voicing_selections")
        .upsert(row, {
          onConflict:
            "song_id,key_context,normalized_chord_symbol,hand_mode",
        })
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async getUserVoicingSelection(
      params: VoicingLookupParams,
    ): Promise<UserVoicingSelectionRow | null> {
      const res = await supabase
        .from("user_voicing_selections")
        .select("*")
        .eq("song_id", params.songId)
        .eq("key_context", params.keyContext)
        .eq("normalized_chord_symbol", params.normalizedChordSymbol)
        .eq("hand_mode", params.handMode)
        .maybeSingle();
      return assertSupabaseData(res);
    },

    async listUserVoicingSelectionsForSong(
      songId: string,
      keyContext: string,
    ): Promise<UserVoicingSelectionRow[]> {
      const res = await supabase
        .from("user_voicing_selections")
        .select("*")
        .eq("song_id", songId)
        .eq("key_context", keyContext);
      return assertSupabaseData(res);
    },

    async deleteVoicingOptionsForSong(songId: string): Promise<void> {
      const res = await supabase
        .from("chord_voicing_options")
        .delete()
        .eq("song_id", songId);
      if (res.error) {
        throw new Error(
          `Supabase error [${res.error.code}]: ${res.error.message}`,
        );
      }
    },
  };
}
