"use client";

import type { CSSProperties } from "react";
import { optionBClassNames } from "@/components/option-b/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildKeyboardRange, midiToScientific } from "@/lib/domain/voicings/piano-layout";
import { cn } from "@/lib/utils";

interface PianoKeyboardVisualizerProps {
  activeNotesMidi: number[];
  slashBassMidi?: number | null;
  slashBassNote?: string | null;
  chordLabel?: string | null;
  emphasis?: "normal" | "hero";
}

const KEYBOARD = buildKeyboardRange(48, 83);

export function PianoKeyboardVisualizer({
  activeNotesMidi,
  slashBassMidi = null,
  slashBassNote = null,
  chordLabel = null,
  emphasis = "normal",
}: PianoKeyboardVisualizerProps) {
  const activeSet = new Set(activeNotesMidi);
  const isHero = emphasis === "hero";

  const whiteKeys = KEYBOARD.filter((key) => !key.isBlack);
  const blackKeys = KEYBOARD.filter((key) => key.isBlack);

  const keyboardVars = {
    "--black-key-width": isHero ? "clamp(10px, 2.6vw, 22px)" : "clamp(8px, 2.2vw, 18px)",
  } as CSSProperties;

  return (
    <Card
      className={cn(
        "rounded-2xl border-[var(--song-border)] shadow-[var(--song-shadow)]",
        isHero
          ? "bg-gradient-to-b from-[var(--song-surface)] to-[var(--song-surface-soft)] shadow-[var(--song-shadow-hover)]"
          : "bg-[var(--song-surface)]",
      )}
    >
      <CardHeader className={isHero ? "pb-2" : undefined}>
        <CardTitle
          className={cn(
            `${optionBClassNames.display} font-bold text-[var(--song-text)]`,
            isHero ? "text-5xl sm:text-6xl" : "text-4xl",
          )}
        >
          Piano
        </CardTitle>
        {isHero ? (
          <p className={`${optionBClassNames.body} text-sm text-[var(--song-text-subtle)]`}>
            Main view of the selected chord
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "relative mx-auto w-full",
            isHero ? "h-56 max-w-none" : "h-40 max-w-[760px]",
          )}
          style={keyboardVars}
        >
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex overflow-hidden rounded-xl border border-[var(--song-border)] bg-[var(--song-surface-soft)]",
              isHero ? "h-50" : "h-36",
            )}
          >
            {whiteKeys.map((key) => {
              const isBass = slashBassMidi !== null && key.midi === slashBassMidi;
              return (
                <div
                  key={key.midi}
                  className={cn(
                    "relative flex min-w-0 flex-1 items-end justify-center border-r border-[var(--song-border)] pb-1 transition-colors",
                    isHero ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[10px]",
                    "last:border-r-0",
                    isBass
                      ? "bg-[var(--song-bass-surface)] font-semibold text-[var(--song-bass-foreground)]"
                      : activeSet.has(key.midi)
                        ? "bg-[var(--song-surface-highlight)] font-semibold text-[var(--song-text)]"
                        : "bg-[var(--song-surface)] text-[var(--song-text-subtle)]",
                  )}
                >
                  {isBass ? (
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 rounded-sm bg-[var(--song-bass)] px-1 text-[8px] font-bold tracking-tight text-[var(--song-surface)]">
                      LH
                    </span>
                  ) : null}
                  {key.note}
                </div>
              );
            })}
          </div>

          <div className={cn("absolute inset-x-0 top-0", isHero ? "h-32" : "h-24")}>
            {blackKeys.map((key) => {
              const precedingWhiteIndex = whiteKeys.findIndex((white) => white.midi > key.midi);
              const leftIndex =
                precedingWhiteIndex === -1 ? whiteKeys.length - 1 : precedingWhiteIndex - 1;
              const leftPercentage = ((leftIndex + 1) / whiteKeys.length) * 100;

              const isBass = slashBassMidi !== null && key.midi === slashBassMidi;
              return (
                <div
                  key={key.midi}
                  className={cn(
                    "absolute z-10 w-[var(--black-key-width)] rounded-b-md border transition-all",
                    isHero ? "h-28" : "h-20",
                    isBass
                      ? "border-[var(--song-bass)] bg-[var(--song-bass-foreground)] ring-2 ring-[var(--song-bass)]/80 shadow-[0_8px_14px_rgba(20,62,69,0.35)] -translate-y-0.5"
                      : activeSet.has(key.midi)
                        ? "border-[#f3d8a5] bg-[#2e2418] ring-2 ring-[#f3d8a5]/80 shadow-[0_0_0_1px_rgba(45,42,36,0.45),0_8px_14px_rgba(45,42,36,0.35)] -translate-y-0.5"
                        : "border-black/60 bg-black",
                  )}
                  style={{
                    left: `calc(${leftPercentage}% - (var(--black-key-width) / 2))`,
                  }}
                >
                  {isBass ? (
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 rounded-sm bg-[var(--song-bass)] px-0.5 text-[7px] font-bold leading-tight text-[var(--song-surface)]">
                      LH
                    </span>
                  ) : activeSet.has(key.midi) ? (
                    <span className="absolute top-1 left-1/2 h-1 w-2.5 -translate-x-1/2 rounded-full bg-[#f6ddb0]" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            `mt-3 space-y-2 text-[var(--song-text-muted)] ${optionBClassNames.body}`,
            isHero ? "text-base" : "text-sm",
          )}
        >
          <p className="flex flex-wrap items-center gap-x-1.5">
            <span className="inline-block size-3 rounded-sm bg-[var(--song-surface-highlight)] ring-1 ring-[var(--song-border)]" />
            <span className="font-medium text-[var(--song-text)]">Right hand</span>{" "}
            {activeNotesMidi.length > 0
              ? activeNotesMidi.map((note) => midiToScientific(note)).join(", ")
              : "None"}
          </p>
          {slashBassMidi ? (
            <p className="flex flex-wrap items-center gap-x-1.5">
              <span className="inline-block size-3 rounded-sm bg-[var(--song-bass)]" />
              <span className="font-medium text-[var(--song-text)]">Left hand (bass)</span>{" "}
              {slashBassNote ?? midiToScientific(slashBassMidi)}
            </p>
          ) : null}
          {slashBassMidi && slashBassNote ? (
            <p className="text-[var(--song-text-subtle)]">
              {chordLabel ? <span className="font-semibold">{chordLabel}</span> : "Slash chord"}
              {": "}
              play <span className="font-semibold">{slashBassNote}</span> with the left hand
              (the note after the &quot;/&quot; is the bass).
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
