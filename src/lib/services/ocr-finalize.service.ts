import { parseManualChordSheet } from "../domain/chords/parse-manual";
import type {
  NotationPreference,
  OCRReviewStatus,
  SongRow,
  SourceType,
} from "@/lib/types/db";

interface OCRFinalizeInput {
  title: string;
  artist: string | null;
  originalKey: string | null;
  sourceType: SourceType;
  notationPreference: NotationPreference;
  validatedText: string;
  ocrImportId?: string | null;
  reviewStatus: "pending" | "validated" | "discarded";
}

interface OCRFinalizePorts {
  songRepository: {
    createSong(input: {
      title: string;
      artist: string | null;
      source_type: SourceType;
      original_key: string | null;
      current_key: string | null;
      notation_preference: NotationPreference;
      raw_text: string;
      normalized_text: string | null;
    }): Promise<SongRow>;
    updateSong(songId: string, patch: { normalized_text: string }): Promise<SongRow>;
  };
  presetRepository: {
    createPreset(input: {
      song_id: string;
      name?: string;
      key_snapshot: string;
      notation_snapshot?: NotationPreference;
    }): Promise<unknown>;
  };
  chordRepository: {
    replaceChordOccurrencesForSong(songId: string, rows: unknown[]): Promise<unknown>;
    replaceUniqueChordsForSong(songId: string, rows: unknown[]): Promise<unknown>;
  };
  ocrRepository: {
    updateOCRImport(
      id: string,
      patch: {
        song_id: string;
        ocr_raw_text: string;
        review_status: OCRReviewStatus;
      },
    ): Promise<unknown>;
  };
}

export async function finalizeOCRToSong(
  input: OCRFinalizeInput,
  ports: OCRFinalizePorts,
) {
  const song = await ports.songRepository.createSong({
    title: input.title,
    artist: input.artist,
    source_type: input.sourceType,
    original_key: input.originalKey,
    current_key: input.originalKey,
    notation_preference: input.notationPreference,
    raw_text: input.validatedText,
    normalized_text: null,
  });

  const parsed = parseManualChordSheet({
    songId: song.id,
    rawText: input.validatedText,
    notationPreference: input.notationPreference,
  });

  await ports.songRepository.updateSong(song.id, {
    normalized_text: parsed.normalizedText,
  });
  await ports.presetRepository.createPreset({
    song_id: song.id,
    name: "Plan de jeu 1",
    key_snapshot: song.current_key ?? song.original_key ?? "C",
    notation_snapshot: song.notation_preference,
  });
  await ports.chordRepository.replaceChordOccurrencesForSong(
    song.id,
    parsed.chordOccurrences,
  );
  await ports.chordRepository.replaceUniqueChordsForSong(song.id, parsed.uniqueChords);

  if (input.ocrImportId) {
    await ports.ocrRepository.updateOCRImport(input.ocrImportId, {
      song_id: song.id,
      ocr_raw_text: input.validatedText,
      review_status: input.reviewStatus,
    });
  }

  return {
    songId: song.id,
    occurrenceCount: parsed.occurrenceCount,
    uniqueChordCount: parsed.uniqueChordCount,
    unknownChords: parsed.unknownChords,
  };
}
