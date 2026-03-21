-- ============================================================
-- ChordLearner MVP — Initial schema migration
-- ============================================================

-- Extensions
create extension if not exists pgcrypto;

-- ============================================================
-- Helper: auto-update updated_at on row modification
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- 1) songs
-- ============================================================
create table songs (
  id                    uuid        primary key default gen_random_uuid(),
  title                 text        not null,
  artist                text,
  source_type           text        not null,
  original_key          text,
  current_key           text,
  notation_preference   text        not null default 'auto',
  raw_text              text        not null default '',
  normalized_text       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint chk_songs_source_type
    check (source_type in ('manual', 'ocr_image')),
  constraint chk_songs_notation_preference
    check (notation_preference in ('auto', 'sharps', 'flats'))
);

create index idx_songs_updated_at on songs (updated_at desc);
create index idx_songs_title on songs (title);

create trigger trg_songs_updated_at
  before update on songs
  for each row execute function set_updated_at();

-- ============================================================
-- 2) chord_occurrences
-- ============================================================
create table chord_occurrences (
  id                        uuid        primary key default gen_random_uuid(),
  song_id                   uuid        not null references songs(id) on delete cascade,
  line_index                integer     not null,
  token_index               integer     not null,
  section_label             text,
  chord_symbol_raw          text        not null,
  chord_symbol_corrected    text,
  normalized_chord_symbol   text        not null,
  base_chord_normalized     text        not null,
  slash_bass                text,
  is_recognized             boolean     not null default true,
  is_user_corrected         boolean     not null default false,
  parse_error_code          text,
  position_start            integer,
  position_end              integer,
  created_at                timestamptz not null default now()
);

create unique index idx_chord_occ_song_line_token
  on chord_occurrences (song_id, line_index, token_index);

create index idx_chord_occ_song_id
  on chord_occurrences (song_id);

create index idx_chord_occ_song_normalized
  on chord_occurrences (song_id, normalized_chord_symbol);

create index idx_chord_occ_song_line
  on chord_occurrences (song_id, line_index);

-- ============================================================
-- 3) unique_chords
-- ============================================================
create table unique_chords (
  id                        uuid        primary key default gen_random_uuid(),
  song_id                   uuid        not null references songs(id) on delete cascade,
  normalized_chord_symbol   text        not null,
  root_note                 text        not null,
  quality                   text        not null,
  slash_bass                text,
  quality_canonical         text        not null,
  interval_set              jsonb       not null default '[]'::jsonb,
  occurrence_count          integer     not null default 1,
  is_supported              boolean     not null default true,
  unsupported_reason        text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create unique index idx_unique_chords_song_symbol
  on unique_chords (song_id, normalized_chord_symbol);

create index idx_unique_chords_song_id
  on unique_chords (song_id);

create index idx_unique_chords_song_supported
  on unique_chords (song_id, is_supported);

create trigger trg_unique_chords_updated_at
  before update on unique_chords
  for each row execute function set_updated_at();

-- ============================================================
-- 4) chord_voicing_options
-- ============================================================
create table chord_voicing_options (
  id                        uuid        primary key default gen_random_uuid(),
  song_id                   uuid        not null references songs(id) on delete cascade,
  key_context               text        not null,
  normalized_chord_symbol   text        not null,
  hand_mode                 text        not null,
  inversion_index           integer     not null default 0,
  voicing_label             text        not null,
  notes_midi                jsonb       not null default '[]'::jsonb,
  notes_scientific          jsonb       not null default '[]'::jsonb,
  display_keys              jsonb       not null default '[]'::jsonb,
  fingering_suggested       jsonb       not null default '{}'::jsonb,
  difficulty_score          integer     not null default 1,
  is_auto_generated         boolean     not null default true,
  created_at                timestamptz not null default now(),

  constraint chk_voicing_hand_mode
    check (hand_mode in ('RH', 'BH')),
  constraint chk_voicing_difficulty
    check (difficulty_score between 1 and 5)
);

create unique index idx_voicing_options_composite
  on chord_voicing_options (song_id, key_context, normalized_chord_symbol, hand_mode, inversion_index);

create index idx_voicing_options_lookup
  on chord_voicing_options (song_id, key_context, normalized_chord_symbol, hand_mode);

create index idx_voicing_options_song_id
  on chord_voicing_options (song_id);

-- ============================================================
-- 5) user_voicing_selections
-- ============================================================
create table user_voicing_selections (
  id                          uuid        primary key default gen_random_uuid(),
  song_id                     uuid        not null references songs(id) on delete cascade,
  key_context                 text        not null,
  normalized_chord_symbol     text        not null,
  hand_mode                   text        not null,
  selected_voicing_option_id  uuid        not null references chord_voicing_options(id) on delete cascade,
  selection_source            text        not null default 'default_auto',
  updated_at                  timestamptz not null default now(),

  constraint chk_selection_hand_mode
    check (hand_mode in ('RH', 'BH')),
  constraint chk_selection_source
    check (selection_source in ('default_auto', 'user_selected'))
);

create unique index idx_user_voicing_sel_composite
  on user_voicing_selections (song_id, key_context, normalized_chord_symbol, hand_mode);

create index idx_user_voicing_sel_song_key
  on user_voicing_selections (song_id, key_context);

create index idx_user_voicing_sel_option
  on user_voicing_selections (selected_voicing_option_id);

create trigger trg_user_voicing_sel_updated_at
  before update on user_voicing_selections
  for each row execute function set_updated_at();

-- ============================================================
-- 6) ocr_imports (skeleton for future OCR feature)
-- ============================================================
create table ocr_imports (
  id                      uuid        primary key default gen_random_uuid(),
  song_id                 uuid        references songs(id) on delete set null,
  image_url               text        not null,
  image_width             integer,
  image_height            integer,
  ocr_provider            text        not null default 'none',
  ocr_raw_text            text        not null default '',
  ocr_structured_tokens   jsonb       not null default '[]'::jsonb,
  review_status           text        not null default 'pending',
  created_at              timestamptz not null default now(),

  constraint chk_ocr_review_status
    check (review_status in ('pending', 'validated', 'discarded'))
);

create index idx_ocr_imports_song_id
  on ocr_imports (song_id);

create index idx_ocr_imports_review_status
  on ocr_imports (review_status);

create index idx_ocr_imports_created_at
  on ocr_imports (created_at desc);
