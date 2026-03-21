import { describe, expect, it, vi } from "vitest";
import type { UserVoicingSelectionRow } from "@/lib/types/db";
import { getOrCreateDefaultSelection } from "./voicing-selection.service";

function makeSelection(): UserVoicingSelectionRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    song_id: "22222222-2222-4222-8222-222222222222",
    key_context: "C",
    normalized_chord_symbol: "Cmaj7",
    hand_mode: "RH",
    selected_voicing_option_id: "33333333-3333-4333-8333-333333333333",
    selection_source: "default_auto",
    updated_at: new Date().toISOString(),
  };
}

describe("voicing selection integration", () => {
  it("creates default_auto selection when none exists", async () => {
    const getUserVoicingSelection = vi.fn(async () => null);
    const upsertUserVoicingSelection = vi.fn(async () => makeSelection());

    const result = await getOrCreateDefaultSelection({
      songId: "22222222-2222-4222-8222-222222222222",
      keyContext: "C",
      chord: "Cmaj7",
      handMode: "RH",
      repository: {
        getUserVoicingSelection,
        upsertUserVoicingSelection,
      },
      defaultVoicingOptionId: "33333333-3333-4333-8333-333333333333",
    });

    expect(getUserVoicingSelection).toHaveBeenCalledTimes(1);
    expect(upsertUserVoicingSelection).toHaveBeenCalledTimes(1);
    expect(result.selection_source).toBe("default_auto");
  });

  it("reuses existing selection without upsert", async () => {
    const existing = makeSelection();
    const getUserVoicingSelection = vi.fn(async () => existing);
    const upsertUserVoicingSelection = vi.fn();

    const result = await getOrCreateDefaultSelection({
      songId: existing.song_id,
      keyContext: existing.key_context,
      chord: existing.normalized_chord_symbol,
      handMode: "RH",
      repository: {
        getUserVoicingSelection,
        upsertUserVoicingSelection,
      },
      defaultVoicingOptionId: existing.selected_voicing_option_id,
    });

    expect(result.id).toBe(existing.id);
    expect(upsertUserVoicingSelection).not.toHaveBeenCalled();
  });
});
