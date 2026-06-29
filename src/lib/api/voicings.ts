import type { SupabaseClient } from "@supabase/supabase-js";
import { createVoicingRepository } from "@/lib/db/repositories/voicing.repository";
import { generateRightHandVoicings } from "@/lib/domain/voicings/voicing-engine";
import type {
  ChordVoicingOptionInsert,
  ChordVoicingOptionRow,
  Database,
  HandMode,
} from "@/lib/types/db";

export async function ensureVoicingOptionsForChord(params: {
  supabase: SupabaseClient<Database>;
  songId: string;
  chord: string;
  keyContext: string;
  handMode: HandMode;
}): Promise<ChordVoicingOptionRow[]> {
  const repo = createVoicingRepository(params.supabase);
  const existing = await repo.listVoicingOptions({
    songId: params.songId,
    keyContext: params.keyContext,
    normalizedChordSymbol: params.chord,
    handMode: params.handMode,
  });
  if (existing.length > 0) return existing;

  if (params.handMode !== "RH") {
    throw new Error("BH hand mode not implemented yet");
  }

  const generated = generateRightHandVoicings(params.chord);
  if (generated.length === 0) {
    throw new Error("Unable to generate voicings for this chord");
  }

  const rows: ChordVoicingOptionInsert[] = generated.map((option) => ({
    song_id: params.songId,
    key_context: params.keyContext,
    normalized_chord_symbol: params.chord,
    hand_mode: "RH",
    inversion_index: option.inversionIndex,
    voicing_label: option.voicingLabel,
    notes_midi: option.notesMidi,
    notes_scientific: option.notesScientific,
    display_keys: option.notesScientific,
    fingering_suggested: option.fingeringSuggested,
    difficulty_score: option.difficultyScore,
    is_auto_generated: true,
  }));

  return repo.insertVoicingOptions(rows);
}

export function pickDefaultVoicingOption(options: ChordVoicingOptionRow[]) {
  if (options.length === 0) return null;
  const sorted = [...options].sort((a, b) => {
    if (a.difficulty_score !== b.difficulty_score) {
      return a.difficulty_score - b.difficulty_score;
    }
    return a.inversion_index - b.inversion_index;
  });
  return sorted[0];
}
