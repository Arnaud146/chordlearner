import {
  getQualityFromSuffix,
  normalizeAccidentals,
  normalizeNote,
} from "./chord-registry";
import { formatChordSymbol } from "./chord-format";
import type { ParsedChord } from "./types";

const CHORD_PATTERN = /^([A-Ga-g][#b]?)([^/\s]*)(?:\/([A-Ga-g][#b]?))?$/;

export function parseChordSymbol(input: string): ParsedChord {
  const sanitizedInput = normalizeAccidentals(input.trim());
  if (!sanitizedInput) {
    return {
      input,
      sanitizedInput,
      rootNote: null,
      qualityCanonical: null,
      qualitySymbol: null,
      slashBass: null,
      normalizedChordSymbol: "",
      isSupported: false,
      parseErrorCode: "EMPTY_INPUT",
    };
  }

  const match = sanitizedInput.match(CHORD_PATTERN);
  if (!match) {
    return {
      input,
      sanitizedInput,
      rootNote: null,
      qualityCanonical: null,
      qualitySymbol: null,
      slashBass: null,
      normalizedChordSymbol: sanitizedInput,
      isSupported: false,
      parseErrorCode: "INVALID_ROOT",
    };
  }

  const rootNote = normalizeNote(match[1]);
  if (!rootNote) {
    return {
      input,
      sanitizedInput,
      rootNote: null,
      qualityCanonical: null,
      qualitySymbol: null,
      slashBass: null,
      normalizedChordSymbol: sanitizedInput,
      isSupported: false,
      parseErrorCode: "INVALID_ROOT",
    };
  }

  const quality = getQualityFromSuffix(match[2] ?? "");
  if (!quality) {
    return {
      input,
      sanitizedInput,
      rootNote,
      qualityCanonical: null,
      qualitySymbol: null,
      slashBass: null,
      normalizedChordSymbol: sanitizedInput,
      isSupported: false,
      parseErrorCode: "UNSUPPORTED_QUALITY",
    };
  }

  const slashBass = match[3] ? normalizeNote(match[3]) : null;
  if (match[3] && !slashBass) {
    return {
      input,
      sanitizedInput,
      rootNote,
      qualityCanonical: quality.canonical,
      qualitySymbol: quality.normalizedSuffix,
      slashBass: null,
      normalizedChordSymbol: sanitizedInput,
      isSupported: false,
      parseErrorCode: "INVALID_SLASH_BASS",
    };
  }

  const normalizedChordSymbol = formatChordSymbol({
    rootNote,
    qualitySymbol: quality.normalizedSuffix,
    slashBass,
  });

  return {
    input,
    sanitizedInput,
    rootNote,
    qualityCanonical: quality.canonical,
    qualitySymbol: quality.normalizedSuffix,
    slashBass,
    normalizedChordSymbol,
    isSupported: true,
    parseErrorCode: null,
  };
}
