-- Security fix: enforce NOT NULL on user_id columns to prevent orphaned rows.
-- Delete any orphaned rows (user_id IS NULL) before adding the constraint.

-- songs
delete from songs where user_id is null;
alter table songs alter column user_id set not null;

-- ocr_imports
delete from ocr_imports where user_id is null;
alter table ocr_imports alter column user_id set not null;

-- song_extractions
delete from song_extractions where user_id is null;
alter table song_extractions alter column user_id set not null;
