"use client";

import { optionBClassNames } from "@/components/option-b/theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotationPreference } from "@/lib/types/db";

const KEYS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

interface KeySelectorProps {
  currentKey: string | null;
  originalKey: string | null;
  notationPreference: NotationPreference;
  onSelectKey: (toKey: string, notationPreference: NotationPreference) => void;
  disabled?: boolean;
}

function optionButtonClass(isActive: boolean): string {
  if (isActive) {
    return `${optionBClassNames.body} min-h-[44px] rounded-xl bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent-hover)]`;
  }
  return `${optionBClassNames.body} min-h-[44px] rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text)] hover:bg-[var(--song-surface-highlight)]`;
}

export function KeySelector({
  currentKey,
  originalKey,
  notationPreference,
  onSelectKey,
  disabled = false,
}: KeySelectorProps) {
  return (
    <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
      <CardHeader>
        <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
          Key
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {KEYS.map((key) => (
            <Button
              key={key}
              variant={currentKey === key ? "default" : "outline"}
              size="sm"
              className={optionButtonClass(currentKey === key)}
              disabled={disabled}
              onClick={() => onSelectKey(key, notationPreference)}
            >
              {key}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text)] hover:bg-[var(--song-surface-highlight)]`}
            disabled={disabled || !originalKey}
            onClick={() => {
              if (originalKey) {
                onSelectKey(originalKey, notationPreference);
              }
            }}
          >
            Reset to original key
          </Button>
          <Button
            variant={notationPreference === "auto" ? "default" : "outline"}
            size="sm"
            className={optionButtonClass(notationPreference === "auto")}
            disabled={disabled}
            onClick={() => currentKey && onSelectKey(currentKey, "auto")}
          >
            Auto
          </Button>
          <Button
            variant={notationPreference === "sharps" ? "default" : "outline"}
            size="sm"
            className={optionButtonClass(notationPreference === "sharps")}
            disabled={disabled}
            onClick={() => currentKey && onSelectKey(currentKey, "sharps")}
          >
            Sharps
          </Button>
          <Button
            variant={notationPreference === "flats" ? "default" : "outline"}
            size="sm"
            className={optionButtonClass(notationPreference === "flats")}
            disabled={disabled}
            onClick={() => currentKey && onSelectKey(currentKey, "flats")}
          >
            Flats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
