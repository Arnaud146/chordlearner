"use client";

import { optionBClassNames } from "@/components/option-b/theme";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UniqueChordRow } from "@/lib/types/db";
import { cn } from "@/lib/utils";

interface UniqueChordListProps {
  chords: UniqueChordRow[];
  selectedChordSymbol?: string | null;
  onSelectChord?: (symbol: string) => void;
}

export function UniqueChordList({
  chords,
  selectedChordSymbol = null,
  onSelectChord,
}: UniqueChordListProps) {
  return (
    <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
      <CardHeader>
        <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
          Unique chords
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chords.length === 0 ? (
          <p className={`${optionBClassNames.body} text-sm text-[var(--song-text-muted)]`}>
            No unique chords.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chords.map((chord) => {
              const isSelected = chord.normalized_chord_symbol === selectedChordSymbol;
              return (
                <button
                  key={chord.id}
                  type="button"
                  onClick={() => onSelectChord?.(chord.normalized_chord_symbol)}
                >
                  <Badge
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      `${optionBClassNames.body} rounded-full px-3 py-1 text-sm font-semibold`,
                      isSelected
                        ? "bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent)]"
                        : "border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text)]",
                      !chord.is_supported && "opacity-75",
                    )}
                  >
                    {chord.normalized_chord_symbol} ({chord.occurrence_count})
                  </Badge>
                  {!chord.is_supported ? (
                    <Badge variant="destructive" className={`${optionBClassNames.body} ml-1 rounded-full`}>
                      unknown
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
