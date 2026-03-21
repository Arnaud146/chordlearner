-- ============================================================
-- ChordLearner - Account ownership and RLS policies
-- ============================================================

-- 1) Ownership columns on root tables.
alter table songs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table songs
  alter column user_id set default auth.uid();

create index if not exists idx_songs_user_id on songs (user_id);
create index if not exists idx_songs_user_updated_at on songs (user_id, updated_at desc);

alter table ocr_imports
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table ocr_imports
  alter column user_id set default auth.uid();

create index if not exists idx_ocr_imports_user_id on ocr_imports (user_id);
create index if not exists idx_ocr_imports_user_created_at on ocr_imports (user_id, created_at desc);

alter table song_extractions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table song_extractions
  alter column user_id set default auth.uid();

create index if not exists idx_song_extractions_user_id on song_extractions (user_id);
create index if not exists idx_song_extractions_user_created_at on song_extractions (user_id, created_at desc);

-- Backfill user ownership where possible (legacy rows).
update ocr_imports oi
set user_id = s.user_id
from songs s
where oi.song_id = s.id
  and oi.user_id is null
  and s.user_id is not null;

update song_extractions se
set user_id = s.user_id
from songs s
where se.song_id = s.id
  and se.user_id is null
  and s.user_id is not null;

-- 2) Enable RLS.
alter table songs enable row level security;
alter table chord_occurrences enable row level security;
alter table unique_chords enable row level security;
alter table chord_voicing_options enable row level security;
alter table user_voicing_selections enable row level security;
alter table practice_presets enable row level security;
alter table preset_voicing_selections enable row level security;
alter table ocr_imports enable row level security;
alter table song_extractions enable row level security;

-- 3) Policies: songs.
drop policy if exists songs_select_own on songs;
create policy songs_select_own
on songs
for select
using (auth.uid() = user_id);

drop policy if exists songs_insert_own on songs;
create policy songs_insert_own
on songs
for insert
with check (auth.uid() = user_id);

drop policy if exists songs_update_own on songs;
create policy songs_update_own
on songs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists songs_delete_own on songs;
create policy songs_delete_own
on songs
for delete
using (auth.uid() = user_id);

-- 4) Policies: song-owned child tables.
drop policy if exists chord_occurrences_select_song_owner on chord_occurrences;
create policy chord_occurrences_select_song_owner
on chord_occurrences
for select
using (
  exists (
    select 1
    from songs s
    where s.id = chord_occurrences.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists chord_occurrences_insert_song_owner on chord_occurrences;
create policy chord_occurrences_insert_song_owner
on chord_occurrences
for insert
with check (
  exists (
    select 1
    from songs s
    where s.id = chord_occurrences.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists chord_occurrences_update_song_owner on chord_occurrences;
create policy chord_occurrences_update_song_owner
on chord_occurrences
for update
using (
  exists (
    select 1
    from songs s
    where s.id = chord_occurrences.song_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from songs s
    where s.id = chord_occurrences.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists chord_occurrences_delete_song_owner on chord_occurrences;
create policy chord_occurrences_delete_song_owner
on chord_occurrences
for delete
using (
  exists (
    select 1
    from songs s
    where s.id = chord_occurrences.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists unique_chords_select_song_owner on unique_chords;
create policy unique_chords_select_song_owner
on unique_chords
for select
using (
  exists (
    select 1
    from songs s
    where s.id = unique_chords.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists unique_chords_insert_song_owner on unique_chords;
create policy unique_chords_insert_song_owner
on unique_chords
for insert
with check (
  exists (
    select 1
    from songs s
    where s.id = unique_chords.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists unique_chords_update_song_owner on unique_chords;
create policy unique_chords_update_song_owner
on unique_chords
for update
using (
  exists (
    select 1
    from songs s
    where s.id = unique_chords.song_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from songs s
    where s.id = unique_chords.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists unique_chords_delete_song_owner on unique_chords;
create policy unique_chords_delete_song_owner
on unique_chords
for delete
using (
  exists (
    select 1
    from songs s
    where s.id = unique_chords.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists chord_voicing_options_select_song_owner on chord_voicing_options;
create policy chord_voicing_options_select_song_owner
on chord_voicing_options
for select
using (
  exists (
    select 1
    from songs s
    where s.id = chord_voicing_options.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists chord_voicing_options_insert_song_owner on chord_voicing_options;
create policy chord_voicing_options_insert_song_owner
on chord_voicing_options
for insert
with check (
  exists (
    select 1
    from songs s
    where s.id = chord_voicing_options.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists chord_voicing_options_update_song_owner on chord_voicing_options;
create policy chord_voicing_options_update_song_owner
on chord_voicing_options
for update
using (
  exists (
    select 1
    from songs s
    where s.id = chord_voicing_options.song_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from songs s
    where s.id = chord_voicing_options.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists chord_voicing_options_delete_song_owner on chord_voicing_options;
create policy chord_voicing_options_delete_song_owner
on chord_voicing_options
for delete
using (
  exists (
    select 1
    from songs s
    where s.id = chord_voicing_options.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists user_voicing_selections_select_song_owner on user_voicing_selections;
create policy user_voicing_selections_select_song_owner
on user_voicing_selections
for select
using (
  exists (
    select 1
    from songs s
    where s.id = user_voicing_selections.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists user_voicing_selections_insert_song_owner on user_voicing_selections;
create policy user_voicing_selections_insert_song_owner
on user_voicing_selections
for insert
with check (
  exists (
    select 1
    from songs s
    where s.id = user_voicing_selections.song_id
      and s.user_id = auth.uid()
  )
  and exists (
    select 1
    from chord_voicing_options cvo
    where cvo.id = user_voicing_selections.selected_voicing_option_id
      and cvo.song_id = user_voicing_selections.song_id
  )
);

drop policy if exists user_voicing_selections_update_song_owner on user_voicing_selections;
create policy user_voicing_selections_update_song_owner
on user_voicing_selections
for update
using (
  exists (
    select 1
    from songs s
    where s.id = user_voicing_selections.song_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from songs s
    where s.id = user_voicing_selections.song_id
      and s.user_id = auth.uid()
  )
  and exists (
    select 1
    from chord_voicing_options cvo
    where cvo.id = user_voicing_selections.selected_voicing_option_id
      and cvo.song_id = user_voicing_selections.song_id
  )
);

drop policy if exists user_voicing_selections_delete_song_owner on user_voicing_selections;
create policy user_voicing_selections_delete_song_owner
on user_voicing_selections
for delete
using (
  exists (
    select 1
    from songs s
    where s.id = user_voicing_selections.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists practice_presets_select_song_owner on practice_presets;
create policy practice_presets_select_song_owner
on practice_presets
for select
using (
  exists (
    select 1
    from songs s
    where s.id = practice_presets.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists practice_presets_insert_song_owner on practice_presets;
create policy practice_presets_insert_song_owner
on practice_presets
for insert
with check (
  exists (
    select 1
    from songs s
    where s.id = practice_presets.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists practice_presets_update_song_owner on practice_presets;
create policy practice_presets_update_song_owner
on practice_presets
for update
using (
  exists (
    select 1
    from songs s
    where s.id = practice_presets.song_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from songs s
    where s.id = practice_presets.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists practice_presets_delete_song_owner on practice_presets;
create policy practice_presets_delete_song_owner
on practice_presets
for delete
using (
  exists (
    select 1
    from songs s
    where s.id = practice_presets.song_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists preset_voicing_selections_select_song_owner on preset_voicing_selections;
create policy preset_voicing_selections_select_song_owner
on preset_voicing_selections
for select
using (
  exists (
    select 1
    from practice_presets p
    join songs s on s.id = p.song_id
    where p.id = preset_voicing_selections.preset_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists preset_voicing_selections_insert_song_owner on preset_voicing_selections;
create policy preset_voicing_selections_insert_song_owner
on preset_voicing_selections
for insert
with check (
  exists (
    select 1
    from practice_presets p
    join songs s on s.id = p.song_id
    join chord_voicing_options cvo on cvo.id = preset_voicing_selections.selected_voicing_option_id
    where p.id = preset_voicing_selections.preset_id
      and cvo.song_id = s.id
      and s.user_id = auth.uid()
  )
);

drop policy if exists preset_voicing_selections_update_song_owner on preset_voicing_selections;
create policy preset_voicing_selections_update_song_owner
on preset_voicing_selections
for update
using (
  exists (
    select 1
    from practice_presets p
    join songs s on s.id = p.song_id
    where p.id = preset_voicing_selections.preset_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from practice_presets p
    join songs s on s.id = p.song_id
    join chord_voicing_options cvo on cvo.id = preset_voicing_selections.selected_voicing_option_id
    where p.id = preset_voicing_selections.preset_id
      and cvo.song_id = s.id
      and s.user_id = auth.uid()
  )
);

drop policy if exists preset_voicing_selections_delete_song_owner on preset_voicing_selections;
create policy preset_voicing_selections_delete_song_owner
on preset_voicing_selections
for delete
using (
  exists (
    select 1
    from practice_presets p
    join songs s on s.id = p.song_id
    where p.id = preset_voicing_selections.preset_id
      and s.user_id = auth.uid()
  )
);

-- 5) Policies: user-owned root OCR / extraction tables.
drop policy if exists ocr_imports_select_owner on ocr_imports;
create policy ocr_imports_select_owner
on ocr_imports
for select
using (
  auth.uid() = user_id
  or (
    song_id is not null
    and exists (
      select 1
      from songs s
      where s.id = ocr_imports.song_id
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists ocr_imports_insert_owner on ocr_imports;
create policy ocr_imports_insert_owner
on ocr_imports
for insert
with check (
  auth.uid() = user_id
  and (
    song_id is null
    or exists (
      select 1
      from songs s
      where s.id = ocr_imports.song_id
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists ocr_imports_update_owner on ocr_imports;
create policy ocr_imports_update_owner
on ocr_imports
for update
using (
  auth.uid() = user_id
  or (
    song_id is not null
    and exists (
      select 1
      from songs s
      where s.id = ocr_imports.song_id
        and s.user_id = auth.uid()
    )
  )
)
with check (
  auth.uid() = user_id
  and (
    song_id is null
    or exists (
      select 1
      from songs s
      where s.id = ocr_imports.song_id
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists ocr_imports_delete_owner on ocr_imports;
create policy ocr_imports_delete_owner
on ocr_imports
for delete
using (
  auth.uid() = user_id
  or (
    song_id is not null
    and exists (
      select 1
      from songs s
      where s.id = ocr_imports.song_id
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists song_extractions_select_owner on song_extractions;
create policy song_extractions_select_owner
on song_extractions
for select
using (
  auth.uid() = user_id
  or (
    song_id is not null
    and exists (
      select 1
      from songs s
      where s.id = song_extractions.song_id
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists song_extractions_insert_owner on song_extractions;
create policy song_extractions_insert_owner
on song_extractions
for insert
with check (
  auth.uid() = user_id
  and (
    song_id is null
    or exists (
      select 1
      from songs s
      where s.id = song_extractions.song_id
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists song_extractions_update_owner on song_extractions;
create policy song_extractions_update_owner
on song_extractions
for update
using (
  auth.uid() = user_id
  or (
    song_id is not null
    and exists (
      select 1
      from songs s
      where s.id = song_extractions.song_id
        and s.user_id = auth.uid()
    )
  )
)
with check (
  auth.uid() = user_id
  and (
    song_id is null
    or exists (
      select 1
      from songs s
      where s.id = song_extractions.song_id
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists song_extractions_delete_owner on song_extractions;
create policy song_extractions_delete_owner
on song_extractions
for delete
using (
  auth.uid() = user_id
  or (
    song_id is not null
    and exists (
      select 1
      from songs s
      where s.id = song_extractions.song_id
        and s.user_id = auth.uid()
    )
  )
);
