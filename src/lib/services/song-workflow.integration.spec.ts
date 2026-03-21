import { describe, expect, it, vi } from "vitest";
import type { SongRow } from "@/lib/types/db";
import {
  parseManualAndPersistSong,
  transposeSongState,
} from "./song-workflow.service";

function makeSongRow(overrides?: Partial<SongRow>): SongRow {
  const merged: SongRow = {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: null,
    title: "Test Song",
    artist: null,
    source_type: "manual",
    original_key: "C",
    current_key: "C",
    notation_preference: "auto",
    raw_text: "",
    normalized_text: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
  return { ...merged, user_id: merged.user_id ?? null };
}

describe("song workflow integration", () => {
  it("create+parse workflow persists song text and chord tables", async () => {
    const updateSong = vi.fn(async () => makeSongRow());
    const replaceOcc = vi.fn(async () => []);
    const replaceUnique = vi.fn(async () => []);

    const result = await parseManualAndPersistSong({
      songId: "11111111-1111-4111-8111-111111111111",
      rawText: "C G Am F",
      originalKey: "C",
      notationPreference: "auto",
      songRepository: {
        updateSong,
        getSongById: async () => makeSongRow(),
      },
      chordRepository: {
        replaceChordOccurrencesForSong: replaceOcc,
        replaceUniqueChordsForSong: replaceUnique,
      },
    });

    expect(updateSong).toHaveBeenCalledTimes(1);
    expect(replaceOcc).toHaveBeenCalledTimes(1);
    expect(replaceUnique).toHaveBeenCalledTimes(1);
    expect(result.occurrenceCount).toBe(4);
    expect(result.uniqueChordCount).toBeGreaterThanOrEqual(3);
  });

  it("transpose workflow updates key and returns semitone delta", async () => {
    const getSongById = vi.fn(async () => makeSongRow({ current_key: "C" }));
    const updateSong = vi.fn(async () => makeSongRow({ current_key: "D" }));

    const result = await transposeSongState({
      songId: "11111111-1111-4111-8111-111111111111",
      toKey: "D",
      notationPreference: "auto",
      songRepository: {
        getSongById,
        updateSong,
      },
    });

    expect(getSongById).toHaveBeenCalled();
    expect(updateSong).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      expect.objectContaining({ current_key: "D" }),
    );
    expect(result.semitoneDelta).toBe(2);
  });
});
