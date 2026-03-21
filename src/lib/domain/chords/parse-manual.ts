import type {
  ChordOccurrenceInsert,
  NotationPreference,
  UniqueChordInsert,
} from "@/lib/types/db";
import { normalizeChordSymbol } from "./chord-normalizer";
import { tokenizeChordText } from "./chord-tokenizer";

export interface ParseManualResult {
  normalizedText: string;
  chordOccurrences: ChordOccurrenceInsert[];
  uniqueChords: UniqueChordInsert[];
  occurrenceCount: number;
  uniqueChordCount: number;
  unknownChords: string[];
}

export function parseManualChordSheet(params: {
  songId: string;
  rawText: string;
  notationPreference: NotationPreference;
}): ParseManualResult {
  const tokens = tokenizeChordText(params.rawText);
  const normalizedByLine = new Map<number, string[]>();
  const unknownChordsSet = new Set<string>();
  const parsedByNormalized = new Map<
    string,
    {
      rootNote: string | null;
      qualityCanonical: string | null;
      qualitySymbol: string | null;
      slashBass: string | null;
      isSupported: boolean;
      parseErrorCode: string | null;
    }
  >();

  const chordOccurrences: ChordOccurrenceInsert[] = tokens.map((token) => {
    const parsed = normalizeChordSymbol(token.value, {
      notationPreference: params.notationPreference,
    });

    const lineValues = normalizedByLine.get(token.lineIndex) ?? [];
    lineValues.push(parsed.normalizedChordSymbol);
    normalizedByLine.set(token.lineIndex, lineValues);

    if (!parsed.isSupported) {
      unknownChordsSet.add(token.value);
    }
    parsedByNormalized.set(parsed.normalizedChordSymbol, {
      rootNote: parsed.rootNote,
      qualityCanonical: parsed.qualityCanonical,
      qualitySymbol: parsed.qualitySymbol,
      slashBass: parsed.slashBass,
      isSupported: parsed.isSupported,
      parseErrorCode: parsed.parseErrorCode,
    });

    return {
      song_id: params.songId,
      line_index: token.lineIndex,
      token_index: token.tokenIndex,
      section_label: null,
      chord_symbol_raw: token.raw,
      chord_symbol_corrected: null,
      normalized_chord_symbol: parsed.normalizedChordSymbol,
      base_chord_normalized: parsed.rootNote
        ? `${parsed.rootNote}${parsed.qualitySymbol ?? ""}`
        : parsed.normalizedChordSymbol,
      slash_bass: parsed.slashBass,
      is_recognized: parsed.isSupported,
      is_user_corrected: false,
      parse_error_code: parsed.parseErrorCode,
      position_start: token.positionStart,
      position_end: token.positionEnd,
    };
  });

  const uniqueMap = new Map<string, UniqueChordInsert>();
  for (const occurrence of chordOccurrences) {
    const key = occurrence.normalized_chord_symbol;
    const existing = uniqueMap.get(key);
    if (existing) {
      existing.occurrence_count = (existing.occurrence_count ?? 1) + 1;
      continue;
    }

    const parsed = parsedByNormalized.get(key);
    const supported = parsed?.isSupported ?? occurrence.is_recognized ?? false;
    uniqueMap.set(key, {
      song_id: params.songId,
      normalized_chord_symbol: key,
      root_note: parsed?.rootNote ?? "UNK",
      quality: parsed?.qualitySymbol ?? "unknown",
      slash_bass: parsed?.slashBass ?? occurrence.slash_bass,
      quality_canonical: parsed?.qualityCanonical ?? "unknown",
      interval_set: [],
      occurrence_count: 1,
      is_supported: supported,
      unsupported_reason:
        supported ? null : parsed?.parseErrorCode ?? occurrence.parse_error_code ?? "unknown",
    });
  }

  const maxLineIndex = tokens.length
    ? Math.max(...tokens.map((token) => token.lineIndex))
    : -1;
  const lines: string[] = [];
  for (let lineIndex = 0; lineIndex <= maxLineIndex; lineIndex += 1) {
    lines.push((normalizedByLine.get(lineIndex) ?? []).join(" "));
  }

  return {
    normalizedText: lines.join("\n").trim(),
    chordOccurrences,
    uniqueChords: Array.from(uniqueMap.values()),
    occurrenceCount: chordOccurrences.length,
    uniqueChordCount: uniqueMap.size,
    unknownChords: Array.from(unknownChordsSet.values()),
  };
}
