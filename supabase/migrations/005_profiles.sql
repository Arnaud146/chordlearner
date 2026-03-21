-- ============================================================
-- ChordLearner - User profiles
-- ============================================================

create table if not exists profiles (
  user_id       uuid        primary key references auth.users(id) on delete cascade,
  display_name  text        not null default '',
  full_name     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint chk_profiles_display_name_length
    check (char_length(btrim(display_name)) between 2 and 40),
  constraint chk_profiles_full_name_length
    check (full_name is null or char_length(btrim(full_name)) <= 80)
);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;

drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own
on profiles
for select
using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own
on profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own
on profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists profiles_delete_own on profiles;
create policy profiles_delete_own
on profiles
for delete
using (auth.uid() = user_id);
