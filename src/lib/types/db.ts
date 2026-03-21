// ============================================================
// Domain union types (mirror SQL CHECK constraints)
// ============================================================

export type SourceType = "manual" | "ocr_image" | "web_page";
export type NotationPreference = "auto" | "sharps" | "flats";
export type HandMode = "RH" | "BH";
export type SelectionSource = "default_auto" | "user_selected";
export type OCRReviewStatus = "pending" | "validated" | "discarded";
export type ExtractionSourceType = "html" | "pdf" | "image" | "unknown";
export type SongExtractionStatus = "pending" | "analyzed" | "fallback" | "error";

// ============================================================
// Row types (what you get back from SELECT)
// Using `type` instead of `interface` so they satisfy
// Record<string, unknown> (implicit index signature).
// ============================================================

export type SongRow = {
  id: string;
  user_id: string | null;
  title: string;
  artist: string | null;
  source_type: SourceType;
  original_key: string | null;
  current_key: string | null;
  notation_preference: NotationPreference;
  raw_text: string;
  normalized_text: string | null;
  created_at: string;
  updated_at: string;
};

export type ChordOccurrenceRow = {
  id: string;
  song_id: string;
  line_index: number;
  token_index: number;
  section_label: string | null;
  chord_symbol_raw: string;
  chord_symbol_corrected: string | null;
  normalized_chord_symbol: string;
  base_chord_normalized: string;
  slash_bass: string | null;
  is_recognized: boolean;
  is_user_corrected: boolean;
  parse_error_code: string | null;
  position_start: number | null;
  position_end: number | null;
  created_at: string;
};

export type UniqueChordRow = {
  id: string;
  song_id: string;
  normalized_chord_symbol: string;
  root_note: string;
  quality: string;
  slash_bass: string | null;
  quality_canonical: string;
  interval_set: number[];
  occurrence_count: number;
  is_supported: boolean;
  unsupported_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ChordVoicingOptionRow = {
  id: string;
  song_id: string;
  key_context: string;
  normalized_chord_symbol: string;
  hand_mode: HandMode;
  inversion_index: number;
  voicing_label: string;
  notes_midi: number[];
  notes_scientific: string[];
  display_keys: string[];
  fingering_suggested: Record<string, unknown>;
  difficulty_score: number;
  is_auto_generated: boolean;
  created_at: string;
};

export type UserVoicingSelectionRow = {
  id: string;
  song_id: string;
  key_context: string;
  normalized_chord_symbol: string;
  hand_mode: HandMode;
  selected_voicing_option_id: string;
  selection_source: SelectionSource;
  updated_at: string;
};

export type PracticePresetRow = {
  id: string;
  song_id: string;
  name: string;
  key_snapshot: string;
  notation_snapshot: NotationPreference;
  created_at: string;
  updated_at: string;
};

export type PresetVoicingSelectionRow = {
  id: string;
  preset_id: string;
  normalized_chord_symbol: string;
  selected_voicing_option_id: string;
  updated_at: string;
};

export type OCRImportRow = {
  id: string;
  user_id: string | null;
  song_id: string | null;
  image_url: string;
  image_width: number | null;
  image_height: number | null;
  ocr_provider: string;
  ocr_raw_text: string;
  ocr_structured_tokens: unknown[];
  review_status: OCRReviewStatus;
  created_at: string;
};

export type SongExtractionRow = {
  id: string;
  user_id: string | null;
  song_id: string | null;
  source_url: string;
  source_type: ExtractionSourceType;
  mode: "web" | "ocr" | "manual";
  title: string | null;
  artist: string | null;
  raw_text: string;
  structured_json: Record<string, unknown>;
  unique_chords: string[];
  status: SongExtractionStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  user_id: string;
  display_name: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================================
// Insert types (required fields when creating a row)
// ============================================================

export type SongInsert = {
  user_id?: string | null;
  title: string;
  artist?: string | null;
  source_type: SourceType;
  original_key?: string | null;
  current_key?: string | null;
  notation_preference?: NotationPreference;
  raw_text?: string;
  normalized_text?: string | null;
};

export type SongUpdate = {
  user_id?: string | null;
  title?: string;
  artist?: string | null;
  source_type?: SourceType;
  original_key?: string | null;
  current_key?: string | null;
  notation_preference?: NotationPreference;
  raw_text?: string;
  normalized_text?: string | null;
};

export type ChordOccurrenceInsert = {
  song_id: string;
  line_index: number;
  token_index: number;
  section_label?: string | null;
  chord_symbol_raw: string;
  chord_symbol_corrected?: string | null;
  normalized_chord_symbol: string;
  base_chord_normalized: string;
  slash_bass?: string | null;
  is_recognized?: boolean;
  is_user_corrected?: boolean;
  parse_error_code?: string | null;
  position_start?: number | null;
  position_end?: number | null;
};

export type UniqueChordInsert = {
  song_id: string;
  normalized_chord_symbol: string;
  root_note: string;
  quality: string;
  slash_bass?: string | null;
  quality_canonical: string;
  interval_set?: number[];
  occurrence_count?: number;
  is_supported?: boolean;
  unsupported_reason?: string | null;
};

export type ChordVoicingOptionInsert = {
  song_id: string;
  key_context: string;
  normalized_chord_symbol: string;
  hand_mode: HandMode;
  inversion_index?: number;
  voicing_label: string;
  notes_midi: number[];
  notes_scientific: string[];
  display_keys: string[];
  fingering_suggested?: Record<string, unknown>;
  difficulty_score?: number;
  is_auto_generated?: boolean;
};

export type UserVoicingSelectionUpsert = {
  song_id: string;
  key_context: string;
  normalized_chord_symbol: string;
  hand_mode: HandMode;
  selected_voicing_option_id: string;
  selection_source?: SelectionSource;
};

export type PracticePresetInsert = {
  song_id: string;
  name?: string;
  key_snapshot: string;
  notation_snapshot?: NotationPreference;
};

export type PracticePresetUpdate = {
  name?: string;
  key_snapshot?: string;
  notation_snapshot?: NotationPreference;
};

export type PresetVoicingSelectionUpsert = {
  preset_id: string;
  normalized_chord_symbol: string;
  selected_voicing_option_id: string;
};

export type OCRImportInsert = {
  user_id?: string | null;
  song_id?: string | null;
  image_url: string;
  image_width?: number | null;
  image_height?: number | null;
  ocr_provider?: string;
  ocr_raw_text?: string;
  ocr_structured_tokens?: unknown[];
  review_status?: OCRReviewStatus;
};

export type OCRImportUpdate = {
  user_id?: string | null;
  song_id?: string | null;
  image_url?: string;
  ocr_provider?: string;
  ocr_raw_text?: string;
  ocr_structured_tokens?: unknown[];
  review_status?: OCRReviewStatus;
};

export type SongExtractionInsert = {
  user_id?: string | null;
  song_id?: string | null;
  source_url: string;
  source_type: ExtractionSourceType;
  mode: "web" | "ocr" | "manual";
  title?: string | null;
  artist?: string | null;
  raw_text?: string;
  structured_json?: Record<string, unknown>;
  unique_chords?: string[];
  status?: SongExtractionStatus;
  error_message?: string | null;
};

export type SongExtractionUpdate = {
  user_id?: string | null;
  song_id?: string | null;
  source_url?: string;
  source_type?: ExtractionSourceType;
  mode?: "web" | "ocr" | "manual";
  title?: string | null;
  artist?: string | null;
  raw_text?: string;
  structured_json?: Record<string, unknown>;
  unique_chords?: string[];
  status?: SongExtractionStatus;
  error_message?: string | null;
};

export type ProfileInsert = {
  user_id: string;
  display_name: string;
  full_name?: string | null;
};

export type ProfileUpdate = {
  display_name?: string;
  full_name?: string | null;
};

// ============================================================
// Supabase Database type (manual, mirrors supabase gen types)
// ============================================================

export type Database = {
  public: {
    Tables: {
      songs: {
        Row: SongRow;
        Insert: SongInsert;
        Update: SongUpdate;
        Relationships: [
          {
            foreignKeyName: "songs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      chord_occurrences: {
        Row: ChordOccurrenceRow;
        Insert: ChordOccurrenceInsert;
        Update: Partial<ChordOccurrenceInsert>;
        Relationships: [
          {
            foreignKeyName: "chord_occurrences_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      unique_chords: {
        Row: UniqueChordRow;
        Insert: UniqueChordInsert;
        Update: Partial<UniqueChordInsert>;
        Relationships: [
          {
            foreignKeyName: "unique_chords_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      chord_voicing_options: {
        Row: ChordVoicingOptionRow;
        Insert: ChordVoicingOptionInsert;
        Update: Partial<ChordVoicingOptionInsert>;
        Relationships: [
          {
            foreignKeyName: "chord_voicing_options_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      user_voicing_selections: {
        Row: UserVoicingSelectionRow;
        Insert: UserVoicingSelectionUpsert;
        Update: Partial<UserVoicingSelectionUpsert>;
        Relationships: [
          {
            foreignKeyName: "user_voicing_selections_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_voicing_selections_voicing_option_id_fkey";
            columns: ["selected_voicing_option_id"];
            isOneToOne: false;
            referencedRelation: "chord_voicing_options";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_presets: {
        Row: PracticePresetRow;
        Insert: PracticePresetInsert;
        Update: PracticePresetUpdate;
        Relationships: [
          {
            foreignKeyName: "practice_presets_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      preset_voicing_selections: {
        Row: PresetVoicingSelectionRow;
        Insert: PresetVoicingSelectionUpsert;
        Update: Partial<PresetVoicingSelectionUpsert>;
        Relationships: [
          {
            foreignKeyName: "preset_voicing_selections_preset_id_fkey";
            columns: ["preset_id"];
            isOneToOne: false;
            referencedRelation: "practice_presets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "preset_voicing_selections_voicing_option_id_fkey";
            columns: ["selected_voicing_option_id"];
            isOneToOne: false;
            referencedRelation: "chord_voicing_options";
            referencedColumns: ["id"];
          },
        ];
      };
      ocr_imports: {
        Row: OCRImportRow;
        Insert: OCRImportInsert;
        Update: OCRImportUpdate;
        Relationships: [
          {
            foreignKeyName: "ocr_imports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ocr_imports_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      song_extractions: {
        Row: SongExtractionRow;
        Insert: SongExtractionInsert;
        Update: SongExtractionUpdate;
        Relationships: [
          {
            foreignKeyName: "song_extractions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "song_extractions_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
