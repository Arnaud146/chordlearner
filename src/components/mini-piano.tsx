"use client";

import { buildKeyboardRange } from "@/lib/domain/voicings/piano-layout";
import { cn } from "@/lib/utils";

interface MiniPianoProps {
  activeNotesMidi: number[];
  slashBassMidi?: number | null;
}

const KEYBOARD = buildKeyboardRange(48, 84);

export function MiniPiano({ activeNotesMidi, slashBassMidi = null }: MiniPianoProps) {
  const activeSet = new Set(activeNotesMidi);

  const whiteKeys = KEYBOARD.filter((key) => !key.isBlack);
  const blackKeys = KEYBOARD.filter((key) => key.isBlack);
  const keyWidth = 12;

  return (
    <div className="overflow-x-auto">
      <div className="relative h-[72px]" style={{ width: `${whiteKeys.length * keyWidth}px` }}>
        <div className="absolute inset-x-0 bottom-0 flex h-[64px]">
          {whiteKeys.map((key) => {
            const isBass = slashBassMidi !== null && key.midi === slashBassMidi;
            return (
              <div
                key={key.midi}
                className={cn(
                  "relative flex shrink-0 items-end justify-center border border-[var(--song-border)] pb-0.5 text-[6px] leading-none transition-colors",
                  isBass
                    ? "border-[var(--song-bass)] bg-[var(--song-bass-surface)] font-semibold text-[var(--song-bass-foreground)]"
                    : activeSet.has(key.midi)
                      ? "border-[#bea77e] bg-[var(--song-surface-highlight)] font-semibold text-[var(--song-text)] shadow-[inset_0_-2px_0_rgba(45,42,36,0.2)]"
                      : "bg-[var(--song-surface)] text-[var(--song-text-subtle)]",
                )}
                style={{ width: `${keyWidth}px` }}
              >
                {key.note}
              </div>
            );
          })}
        </div>
        <div className="absolute inset-x-0 top-0 h-[42px]">
          {blackKeys.map((key) => {
            const precedingWhiteIndex = whiteKeys.findIndex((white) => white.midi > key.midi);
            const leftIndex = precedingWhiteIndex === -1 ? whiteKeys.length - 1 : precedingWhiteIndex - 1;
            const isBass = slashBassMidi !== null && key.midi === slashBassMidi;
            return (
              <div
                key={key.midi}
                className={cn(
                  "absolute z-10 h-[36px] w-2 rounded-b-sm border transition-all",
                  isBass
                    ? "border-[var(--song-bass)] bg-[var(--song-bass-foreground)] ring-2 ring-[var(--song-bass)]/75"
                    : activeSet.has(key.midi)
                      ? "border-[#f3d8a5] bg-[#2e2418] ring-2 ring-[#f3d8a5]/75 shadow-[0_0_0_1px_rgba(45,42,36,0.45)]"
                      : "border-black/30 bg-black",
                )}
                style={{ left: `${leftIndex * keyWidth + keyWidth - 4}px` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
