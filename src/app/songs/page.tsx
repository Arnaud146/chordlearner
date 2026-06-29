import Link from "next/link";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";
import { SongsBrowser } from "@/components/songs-browser";
import { Button } from "@/components/ui/button";
import { createSongRepository } from "@/lib/db/repositories/song.repository";
import { createClient } from "@/lib/supabase/server";

export default async function SongsPage() {
  let songs: Awaited<ReturnType<ReturnType<typeof createSongRepository>["listSongs"]>> = [];
  let loadError: string | null = null;

  try {
    const supabase = await createClient();
    const repo = createSongRepository(supabase);
    songs = await repo.listSongs();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unknown Supabase error";
  }

  return (
    <div
      className={`${optionBDisplayFont.variable} ${optionBBodyFont.variable} song-shell space-y-8 bg-[var(--song-bg)] text-[var(--song-text)]`}
    >
      <section className="space-y-4">
        <p
          className={`${optionBClassNames.body} text-xs font-semibold uppercase tracking-[0.14em] text-[var(--song-text-subtle)]`}
        >
          Library
        </p>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <h1
              className={`${optionBClassNames.display} text-5xl leading-[0.95] font-bold text-[var(--song-text)] md:text-7xl`}
            >
              Practice your chords in
              <br />
              real songs.
            </h1>
            <p
              className={`${optionBClassNames.body} max-w-3xl text-lg text-[var(--song-text-muted)] md:text-xl`}
            >
              Instant search by title, artist or key to find a song in
              seconds.
            </p>
          </div>

          <Link href="/songs/new">
            <Button
              className={`${optionBClassNames.body} min-h-[44px] rounded-xl bg-[var(--song-accent)] px-5 py-3 text-sm font-bold text-[var(--song-accent-foreground)] shadow-[var(--song-shadow)] hover:bg-[var(--song-accent-hover)]`}
            >
              + New song
            </Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
          My songs ({songs.length})
        </h2>

        {loadError ? (
          <div className="rounded-2xl border border-[var(--song-danger-border)] bg-[var(--song-danger-surface)] p-6 shadow-[var(--song-shadow)]">
            <p className={`${optionBClassNames.body} text-sm font-semibold text-[var(--song-danger)]`}>
              Unable to load Supabase.
            </p>
            <p className={`${optionBClassNames.body} mt-2 text-sm text-[var(--song-danger)]`}>
              {loadError}
            </p>
            <p className={`${optionBClassNames.body} mt-2 text-xs text-[var(--song-danger)]`}>
              Check `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and your
              network connection, then reload the page.
            </p>
          </div>
        ) : songs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--song-border)] bg-[var(--song-surface)] p-8 text-center shadow-[var(--song-shadow)]">
            <p className={`${optionBClassNames.body} text-base text-[var(--song-text-muted)]`}>
              No songs yet. Add your first song to get started.
            </p>
          </div>
        ) : (
          <SongsBrowser songs={songs} />
        )}
      </section>

      <section className="rounded-2xl bg-[var(--song-accent)] px-6 py-6 shadow-[var(--song-shadow)]">
        <p
          className={`${optionBClassNames.display} text-4xl leading-tight font-bold text-[var(--song-accent-foreground)]`}
        >
          Consistency beats intensity: 10 focused minutes every day.
        </p>
      </section>
    </div>
  );
}
