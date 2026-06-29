"use client";

import { optionBClassNames } from "@/components/option-b/theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InversionSelectorProps {
  options: Array<{
    inversionIndex: number;
    label: string;
  }>;
  selectedInversionIndex: number;
  onSelectInversion: (inversionIndex: number) => void;
}

export function InversionSelector({
  options,
  selectedInversionIndex,
  onSelectInversion,
}: InversionSelectorProps) {
  return (
    <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
      <CardHeader>
        <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
          Inversion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {options.length === 0 ? (
          <p className={`${optionBClassNames.body} text-sm text-[var(--song-text-muted)]`}>
            No voicing available for this chord.
          </p>
        ) : null}
        {options.map((option) => {
          const isSelected = option.inversionIndex === selectedInversionIndex;
          return (
            <Button
              key={option.inversionIndex}
              type="button"
              variant={isSelected ? "default" : "outline"}
              className={`${optionBClassNames.body} w-full justify-start rounded-xl ${
                isSelected
                  ? "bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent)]"
                  : "border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text)] hover:bg-[var(--song-surface-highlight)]"
              }`}
              onClick={() => onSelectInversion(option.inversionIndex)}
            >
              {option.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
