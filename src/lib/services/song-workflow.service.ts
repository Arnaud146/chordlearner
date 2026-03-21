import type {
  ChordOccurrenceInsert,
  NotationPreference,
  SongRow,
  UniqueChordInsert,
} from "@/lib/types/db";
import { parseManualChordSheet } from "../domain/chords/parse-manual";
import { getSemitoneDelta } from "../domain/transposition/transpose-note";

export interface SongRepositoryPort {
  updateSong(songId: string, patch: {
    original_key?: string | null;
    current_key?: string | null;
    notation_preference?: NotationPreference;
    raw_text?: string;
    normalized_text?: string | null;
  }): Promise<SongRow>;
  getSongById(songId: string): Promise<SongRow>;
}

export interface ChordRepositoryPort {
  replaceChordOccurrencesForSong(
    songId: string,
    rows: ChordOccurrenceInsert[],
  ): Promise<unknown>;
  replaceUniqueChordsForSong(
    songId: string,
    rows: UniqueChordInsert[],
  ): Promise<unknown>;
}

export async function parseManualAndPersistSong(params: {
  songId: string;
  rawText: string;
  originalKey: string | null;
  notationPreference: NotationPreference;
  songRepository: SongRepositoryPort;
  chordRepository: ChordRepositoryPort;
}) {
  const parseResult = parseManualChordSheet({
    songId: params.songId,
    rawText: params.rawText,
    notationPreference: params.notationPreference,
  });

  await params.songRepository.updateSong(params.songId, {
    original_key: params.originalKey ?? null,
    current_key: params.originalKey ?? null,
    notation_preference: params.notationPreference,
    raw_text: params.rawText,
    normalized_text: parseResult.normalizedText,
  });

  await params.chordRepository.replaceChordOccurrencesForSong(
    params.songId,
    parseResult.chordOccurrences,
  );
  await params.chordRepository.replaceUniqueChordsForSong(
    params.songId,
    parseResult.uniqueChords,
  );

  return {
    occurrenceCount: parseResult.occurrenceCount,
    uniqueChordCount: parseResult.uniqueChordCount,
    unknownChords: parseResult.unknownChords,
  };
}

export async function transposeSongState(params: {
  songId: string;
  toKey: string;
  notationPreference: NotationPreference;
  songRepository: SongRepositoryPort;
}) {
  const song = await params.songRepository.getSongById(params.songId);
  const fromKey = song.current_key ?? song.original_key ?? params.toKey;
  const semitoneDelta = getSemitoneDelta(fromKey, params.toKey);

  const updatedSong = await params.songRepository.updateSong(params.songId, {
    current_key: params.toKey,
    notation_preference: params.notationPreference,
  });

  return {
    song: updatedSong,
    fromKey,
    toKey: params.toKey,
    notationPreference: params.notationPreference,
    semitoneDelta,
  };
}
