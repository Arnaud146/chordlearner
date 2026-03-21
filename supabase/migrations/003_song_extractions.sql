-- ============================================================
-- ChordLearner - Web extraction tracking
-- ============================================================

-- Extend songs source_type enum-like check to support web imports.
alter table songs
  drop constraint if exists chk_songs_source_type;

alter table songs
  add constraint chk_songs_source_type
  check (source_type in ('manual', 'ocr_image', 'web_page'));

-- Keep extraction attempts for observability and future reprocessing.
create table song_extractions (
  id                uuid        primary key default gen_random_uuid(),
  song_id           uuid        references songs(id) on delete set null,
  source_url        text        not null,
  source_type       text        not null,
  mode              text        not null,
  title             text,
  artist            text,
  raw_text          text        not null default '',
  structured_json   jsonb       not null default '{}'::jsonb,
  unique_chords     jsonb       not null default '[]'::jsonb,
  status            text        not null default 'analyzed',
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint chk_song_extractions_source_type
    check (source_type in ('html', 'pdf', 'image', 'unknown')),
  constraint chk_song_extractions_mode
    check (mode in ('web', 'ocr', 'manual')),
  constraint chk_song_extractions_status
    check (status in ('pending', 'analyzed', 'fallback', 'error'))
);

create index idx_song_extractions_song_id
  on song_extractions (song_id);

create index idx_song_extractions_created_at
  on song_extractions (created_at desc);

create index idx_song_extractions_source_type_mode
  on song_extractions (source_type, mode);

create trigger trg_song_extractions_updated_at
  before update on song_extractions
  for each row execute function set_updated_at();
