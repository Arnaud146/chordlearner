import type {
  HandMode,
  UserVoicingSelectionRow,
} from "@/lib/types/db";

export interface VoicingRepositoryPort {
  getUserVoicingSelection(params: {
    songId: string;
    keyContext: string;
    normalizedChordSymbol: string;
    handMode: HandMode;
  }): Promise<UserVoicingSelectionRow | null>;
  upsertUserVoicingSelection(row: {
    song_id: string;
    key_context: string;
    normalized_chord_symbol: string;
    hand_mode: HandMode;
    selected_voicing_option_id: string;
    selection_source?: "default_auto" | "user_selected";
  }): Promise<UserVoicingSelectionRow>;
}

export async function getOrCreateDefaultSelection(params: {
  songId: string;
  keyContext: string;
  chord: string;
  handMode: HandMode;
  repository: VoicingRepositoryPort;
  defaultVoicingOptionId: string;
}) {
  const existing = await params.repository.getUserVoicingSelection({
    songId: params.songId,
    keyContext: params.keyContext,
    normalizedChordSymbol: params.chord,
    handMode: params.handMode,
  });
  if (existing) return existing;

  return params.repository.upsertUserVoicingSelection({
    song_id: params.songId,
    key_context: params.keyContext,
    normalized_chord_symbol: params.chord,
    hand_mode: params.handMode,
    selected_voicing_option_id: params.defaultVoicingOptionId,
    selection_source: "default_auto",
  });
}
