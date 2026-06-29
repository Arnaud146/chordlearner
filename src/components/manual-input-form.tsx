"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { optionBClassNames } from "@/components/option-b/theme";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NotationPreference, SongRow } from "@/lib/types/db";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { data?: T; error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "An error occurred");
  }
  if (!payload.data) {
    throw new Error("Invalid API response");
  }
  return payload.data;
}

export function ManualInputForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [originalKey, setOriginalKey] = useState("");
  const [rawText, setRawText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const createResponse = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist: artist.trim() ? artist : null,
          originalKey: originalKey.trim() ? originalKey : null,
          sourceType: "manual",
          notationPreference: "auto" satisfies NotationPreference,
        }),
      });
      const createdSong = await parseApiResponse<SongRow>(createResponse);

      const parseResponse = await fetch(`/api/songs/${createdSong.id}/parse-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          originalKey: originalKey.trim() ? originalKey : null,
          notationPreference: "auto" satisfies NotationPreference,
        }),
      });
      await parseApiResponse(parseResponse);

      router.push(`/songs/${createdSong.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the song. Check your input and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rounded-2xl border border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
      <CardHeader>
        <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
          Song details
        </CardTitle>
        <CardDescription className={`${optionBClassNames.body} text-sm text-[var(--song-text-muted)]`}>
          Fill in the info then start parsing the chart.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title" className={`${optionBClassNames.body} text-[var(--song-text)]`}>
              Title
            </Label>
            <Input
              id="title"
              placeholder="Example: Imagine"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              disabled={isSubmitting}
              className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)]`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist" className={`${optionBClassNames.body} text-[var(--song-text)]`}>
              Artist
            </Label>
            <Input
              id="artist"
              placeholder="Example: John Lennon"
              value={artist}
              onChange={(event) => setArtist(event.target.value)}
              disabled={isSubmitting}
              className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)]`}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="originalKey"
              className={`${optionBClassNames.body} text-[var(--song-text)]`}
            >
              Original key (optional)
            </Label>
            <Input
              id="originalKey"
              placeholder="Example: C, F#, Bb"
              value={originalKey}
              onChange={(event) => setOriginalKey(event.target.value)}
              disabled={isSubmitting}
              className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)]`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rawText" className={`${optionBClassNames.body} text-[var(--song-text)]`}>
              Chord chart (raw text)
            </Label>
            <textarea
              id="rawText"
              className={`${optionBClassNames.body} min-h-48 w-full rounded-xl border border-[var(--song-border)] bg-[var(--song-surface-soft)] px-3 py-2 text-sm outline-none ring-[var(--song-border)]/40 focus-visible:ring-[3px]`}
              placeholder={"Example:\nC   G   Am   F\nDm7   G   C/E"}
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              disabled={isSubmitting}
              required
            />
            <p className={`${optionBClassNames.body} text-xs text-[var(--song-text-subtle)]`}>
              Verse/chorus example:
              <br />
              C   G   Am   F
              <br />
              Dm7   G   C/E
              <br />
              Chorus: F   G   Em7   Am
            </p>
          </div>
          {errorMessage ? (
            <p className={`${optionBClassNames.body} text-sm font-medium text-[var(--song-danger)]`}>
              {errorMessage}
            </p>
          ) : null}
          <Button
            type="submit"
            className={`${optionBClassNames.body} min-h-[44px] w-full rounded-xl bg-[var(--song-accent)] font-bold text-[var(--song-accent-foreground)] shadow-[var(--song-shadow)] hover:bg-[var(--song-accent-hover)]`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Parsing..." : "Parse and create the song"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
