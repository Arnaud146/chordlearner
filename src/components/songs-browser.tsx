"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { optionBClassNames } from "@/components/option-b/theme";
import { SongCard } from "@/components/song-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SongRow } from "@/lib/types/db";

interface SongsBrowserProps {
  songs: SongRow[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function SongsBrowser({ songs }: SongsBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>("all");

  const keyFilters = useMemo(() => {
    const unique = new Set<string>();
    for (const song of songs) {
      const key = song.current_key ?? song.original_key;
      if (key) unique.add(key);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [songs]);

  const filteredSongs = useMemo(() => {
    const normalizedQuery = normalize(searchQuery);

    return songs.filter((song) => {
      const matchesKey =
        selectedKey === "all" ||
        song.current_key === selectedKey ||
        song.original_key === selectedKey;

      if (!matchesKey) return false;
      if (!normalizedQuery) return true;

      const haystack = normalize(
        [
          song.title,
          song.artist ?? "",
          song.current_key ?? "",
          song.original_key ?? "",
        ].join(" "),
      );
      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, selectedKey, songs]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedKey !== "all";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--song-border)] bg-[var(--song-surface-muted)] p-4 shadow-[var(--song-shadow)]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--song-text-subtle)]" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by song, artist or key..."
            className={`${optionBClassNames.body} h-10 rounded-xl border-[var(--song-border)] bg-[var(--song-surface)] pr-10 pl-9 text-[var(--song-text)]`}
            aria-label="Search for a song"
          />
          {searchQuery.trim() ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full text-[var(--song-text-subtle)] hover:bg-[var(--song-surface-highlight)]"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </Button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="xs"
            variant={selectedKey === "all" ? "default" : "outline"}
            className={`${optionBClassNames.body} rounded-full border-[var(--song-border)] px-3 ${
              selectedKey === "all"
                ? "bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent-hover)]"
                : "bg-[var(--song-surface)] text-[var(--song-text-muted)] hover:bg-[var(--song-surface-highlight)]"
            }`}
            onClick={() => setSelectedKey("all")}
          >
            All keys
          </Button>
          {keyFilters.map((key) => (
            <Button
              key={key}
              type="button"
              size="xs"
              variant={selectedKey === key ? "default" : "outline"}
              className={`${optionBClassNames.body} rounded-full border-[var(--song-border)] px-3 ${
                selectedKey === key
                  ? "bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent-hover)]"
                  : "bg-[var(--song-surface)] text-[var(--song-text-muted)] hover:bg-[var(--song-surface-highlight)]"
              }`}
              onClick={() => setSelectedKey(key)}
            >
              {key}
            </Button>
          ))}
        </div>

        <p className={`${optionBClassNames.body} mt-3 text-sm text-[var(--song-text-subtle)]`}>
          {filteredSongs.length} song{filteredSongs.length > 1 ? "s" : ""} shown of{" "}
          {songs.length}
          {hasActiveFilters ? " (filters active)" : ""}
        </p>
      </div>

      {filteredSongs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--song-border)] bg-[var(--song-surface)] p-8 text-center shadow-[var(--song-shadow)]">
          <p className={`${optionBClassNames.body} text-base text-[var(--song-text-muted)]`}>
            No song matches this search.
          </p>
          <p className={`${optionBClassNames.body} mt-1 text-sm text-[var(--song-text-subtle)]`}>
            Try another keyword or remove the key filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              id={song.id}
              title={song.title}
              artist={song.artist}
              musicalKey={song.current_key ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
