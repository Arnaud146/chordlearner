import { describe, expect, it, vi } from "vitest";
import type { SongRow } from "@/lib/types/db";
import { finalizeOCRToSong } from "./ocr-finalize.service";

function makeSongRow(): SongRow {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    user_id: null,
    title: "OCR Song",
    artist: null,
    source_type: "ocr_image",
    original_key: "C",
    current_key: "C",
    notation_preference: "auto",
    raw_text: "C G Am F",
    normalized_text: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("ocr finalize integration", () => {
  it("creates song and persists parsed chord data", async () => {
    const createSong = vi.fn(async () => makeSongRow());
    const updateSong = vi.fn(async () => makeSongRow());
    const createPreset = vi.fn(async () => ({}));
    const replaceOcc = vi.fn(async () => []);
    const replaceUnique = vi.fn(async () => []);
    const updateOCRImport = vi.fn(async () => ({}));

    const result = await finalizeOCRToSong(
      {
        title: "OCR Song",
        artist: null,
        originalKey: "C",
        sourceType: "ocr_image",
        notationPreference: "auto",
        validatedText: "C G Am F",
        ocrImportId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        reviewStatus: "validated",
      },
      {
        songRepository: { createSong, updateSong },
        presetRepository: { createPreset },
        chordRepository: {
          replaceChordOccurrencesForSong: replaceOcc,
          replaceUniqueChordsForSong: replaceUnique,
        },
        ocrRepository: { updateOCRImport },
      },
    );

    expect(createSong).toHaveBeenCalledTimes(1);
    expect(updateSong).toHaveBeenCalledTimes(1);
    expect(createPreset).toHaveBeenCalledTimes(1);
    expect(replaceOcc).toHaveBeenCalledTimes(1);
    expect(replaceUnique).toHaveBeenCalledTimes(1);
    expect(updateOCRImport).toHaveBeenCalledTimes(1);
    expect(result.songId).toBe(makeSongRow().id);
  });
});
