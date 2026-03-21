export type NotationPreference = "auto" | "sharps" | "flats";

export type QualityCanonical =
  | "major"
  | "minor"
  | "dominant7"
  | "major7"
  | "minor7"
  | "sus2"
  | "sus4"
  | "add9"
  | "sixth"
  | "minor6"
  | "diminished"
  | "augmented";

export interface ChordToken {
  raw: string;
  value: string;
  lineIndex: number;
  tokenIndex: number;
  positionStart: number;
  positionEnd: number;
}

export interface ParsedChord {
  input: string;
  sanitizedInput: string;
  rootNote: string | null;
  qualityCanonical: QualityCanonical | null;
  qualitySymbol: string | null;
  slashBass: string | null;
  normalizedChordSymbol: string;
  isSupported: boolean;
  parseErrorCode:
    | "EMPTY_INPUT"
    | "INVALID_ROOT"
    | "UNSUPPORTED_QUALITY"
    | "INVALID_SLASH_BASS"
    | null;
}
