-- ============================================================
-- ChordLearner — Practice Presets migration
-- ============================================================

-- 7) practice_presets
create table practice_presets (
  id                    uuid        primary key default gen_random_uuid(),
  song_id               uuid        not null references songs(id) on delete cascade,
  name                  text        not null default 'Plan de jeu 1',
  key_snapshot          text        not null,
  notation_snapshot     text        not null default 'auto',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint chk_preset_notation
    check (notation_snapshot in ('auto', 'sharps', 'flats'))
);

create index idx_practice_presets_song_id on practice_presets (song_id);

create trigger trg_practice_presets_updated_at
  before update on practice_presets
  for each row execute function set_updated_at();

-- 8) preset_voicing_selections
create table preset_voicing_selections (
  id                          uuid        primary key default gen_random_uuid(),
  preset_id                   uuid        not null references practice_presets(id) on delete cascade,
  normalized_chord_symbol     text        not null,
  selected_voicing_option_id  uuid        not null references chord_voicing_options(id) on delete cascade,
  updated_at                  timestamptz not null default now()
);

create unique index idx_preset_voicing_sel_composite
  on preset_voicing_selections (preset_id, normalized_chord_symbol);

create index idx_preset_voicing_sel_preset_id
  on preset_voicing_selections (preset_id);

create trigger trg_preset_voicing_sel_updated_at
  before update on preset_voicing_selections
  for each row execute function set_updated_at();
