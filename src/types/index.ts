// Re-export all DB types for convenience
export type {
  SongRow,
  SongInsert,
  SongUpdate,
  ChordOccurrenceRow,
  ChordOccurrenceInsert,
  UniqueChordRow,
  UniqueChordInsert,
  ChordVoicingOptionRow,
  ChordVoicingOptionInsert,
  UserVoicingSelectionRow,
  UserVoicingSelectionUpsert,
  OCRImportRow,
  OCRImportInsert,
  OCRImportUpdate,
  SongExtractionRow,
  SongExtractionInsert,
  SongExtractionUpdate,
  SourceType,
  ExtractionSourceType,
  SongExtractionStatus,
  NotationPreference,
  HandMode,
  SelectionSource,
  OCRReviewStatus,
  Database,
} from "@/lib/types/db";

export type MusicalKey =
  | "C"
  | "C#"
  | "Db"
  | "D"
  | "D#"
  | "Eb"
  | "E"
  | "F"
  | "F#"
  | "Gb"
  | "G"
  | "G#"
  | "Ab"
  | "A"
  | "A#"
  | "Bb"
  | "B";
