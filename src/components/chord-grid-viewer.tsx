"use client";

import { optionBClassNames } from "@/components/option-b/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChordOccurrenceRow } from "@/lib/types/db";
import { cn } from "@/lib/utils";

interface ChordGridViewerProps {
  occurrences?: ChordOccurrenceRow[];
  selectedChordSymbol?: string | null;
  onSelectChord?: (symbol: string) => void;
}

function getLineGroups(occurrences: ChordOccurrenceRow[]) {
  const groups = new Map<number, ChordOccurrenceRow[]>();
  for (const occurrence of occurrences) {
    const line = groups.get(occurrence.line_index) ?? [];
    line.push(occurrence);
    groups.set(occurrence.line_index, line);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([, line]) => line.sort((a, b) => a.token_index - b.token_index));
}

export function ChordGridViewer({
  occurrences,
  selectedChordSymbol = null,
  onSelectChord,
}: ChordGridViewerProps) {
  const hasData = Boolean(occurrences?.length);
  const lines = hasData ? getLineGroups(occurrences ?? []) : [];

  return (
    <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
      <CardHeader>
        <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
          Grille d&apos;accords
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="space-y-3">
            <p className={`${optionBClassNames.body} text-sm text-[var(--song-text-subtle)]`}>
              En attente d&apos;accords analyses.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="flex h-14 items-center justify-center rounded-lg border border-dashed border-[var(--song-border)] bg-[var(--song-surface-soft)]"
                >
                  <span className="h-2 w-10 animate-pulse rounded-full bg-[var(--song-border)]" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} className="flex flex-wrap gap-2">
                {line.map((occurrence) => {
                  const isSelected = selectedChordSymbol === occurrence.normalized_chord_symbol;
                  const isUnknown = !occurrence.is_recognized;
                  return (
                    <button
                      key={occurrence.id}
                      type="button"
                      onClick={() => onSelectChord?.(occurrence.normalized_chord_symbol)}
                      className={cn(
                        "h-12 min-w-16 rounded-xl border px-3 text-sm font-semibold transition-colors",
                        "hover:bg-[var(--song-surface-highlight)]",
                        isSelected
                          ? "border-[var(--song-accent)] bg-[var(--song-surface-highlight)] text-[var(--song-accent)]"
                          : "border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text)]",
                        isUnknown && "border-[var(--song-danger-border)] text-[var(--song-danger)]",
                      )}
                      title={isUnknown ? "Accord non reconnu" : "Accord reconnu"}
                    >
                      {occurrence.normalized_chord_symbol}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
