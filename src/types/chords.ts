export type ExtractionMode = "web" | "ocr" | "manual";

export type LineType =
  | "section"
  | "chord_line"
  | "lyric_line"
  | "mixed_line"
  | "empty";

export type SourceKind = "html" | "pdf" | "image" | "unknown";

export type SongSectionType =
  | "intro"
  | "verse"
  | "chorus"
  | "bridge"
  | "pre_chorus"
  | "refrain"
  | "outro"
  | "instrumental"
  | "other";

export interface SongLine {
  index: number;
  type: LineType;
  raw: string;
  chords: string[];
  lyrics: string | null;
}

export interface StructuredSongLine {
  kind: "chords_only" | "lyrics_only" | "lyrics_with_chords";
  raw: string;
  chords: string[];
  lyrics?: string;
  rawLyrics?: string;
  rawChords?: string;
}

export interface SongSection {
  type: SongSectionType;
  label: string;
  index?: number;
  lines: StructuredSongLine[];
}

interface StructuredSongStats {
  totalLines: number;
  chordLines: number;
  lyricLines: number;
  mixedLines: number;
  sections: number;
}

export interface StructuredSong {
  title: string;
  sourceUrl: string;
  mode: ExtractionMode;
  sections: SongSection[];
  allChords: string[];
  stats: StructuredSongStats;
}

export interface ChordExtractionDebug {
  sourceKind: SourceKind;
  selectedExtractor: string;
  candidateBlocks: string[];
  rawLines: string[];
}

export interface ChordExtractionResult {
  success: boolean;
  mode: ExtractionMode;
  fallbackUsed: boolean;
  message: string;
  song?: StructuredSong;
  debug?: ChordExtractionDebug;
  error?: string;
}
