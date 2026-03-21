import { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  PracticePresetInsert,
  PracticePresetRow,
  PracticePresetUpdate,
  PresetVoicingSelectionRow,
  PresetVoicingSelectionUpsert,
} from "@/lib/types/db";
import { assertSupabaseData } from "@/lib/db/helpers";

export function createPresetRepository(supabase: SupabaseClient<Database>) {
  return {
    async listPresetsForSong(songId: string): Promise<PracticePresetRow[]> {
      const res = await supabase
        .from("practice_presets")
        .select("*")
        .eq("song_id", songId)
        .order("created_at");
      return assertSupabaseData(res);
    },

    async getPresetById(presetId: string): Promise<PracticePresetRow> {
      const res = await supabase
        .from("practice_presets")
        .select("*")
        .eq("id", presetId)
        .single();
      return assertSupabaseData(res);
    },

    async createPreset(
      insert: PracticePresetInsert,
    ): Promise<PracticePresetRow> {
      const res = await supabase
        .from("practice_presets")
        .insert(insert)
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async updatePreset(
      presetId: string,
      update: PracticePresetUpdate,
    ): Promise<PracticePresetRow> {
      const res = await supabase
        .from("practice_presets")
        .update(update)
        .eq("id", presetId)
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async deletePreset(presetId: string): Promise<void> {
      const res = await supabase
        .from("practice_presets")
        .delete()
        .eq("id", presetId);
      if (res.error) {
        throw new Error(
          `Supabase error [${res.error.code}]: ${res.error.message}`,
        );
      }
    },

    async listPresetVoicingSelections(
      presetId: string,
    ): Promise<PresetVoicingSelectionRow[]> {
      const res = await supabase
        .from("preset_voicing_selections")
        .select("*")
        .eq("preset_id", presetId);
      return assertSupabaseData(res);
    },

    async upsertPresetVoicingSelection(
      row: PresetVoicingSelectionUpsert,
    ): Promise<PresetVoicingSelectionRow> {
      const res = await supabase
        .from("preset_voicing_selections")
        .upsert(row, {
          onConflict: "preset_id,normalized_chord_symbol",
        })
        .select()
        .single();
      return assertSupabaseData(res);
    },

    async bulkInsertPresetVoicingSelections(
      rows: PresetVoicingSelectionUpsert[],
    ): Promise<PresetVoicingSelectionRow[]> {
      if (rows.length === 0) return [];
      const res = await supabase
        .from("preset_voicing_selections")
        .insert(rows)
        .select();
      return assertSupabaseData(res);
    },
  };
}
