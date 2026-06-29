"use client";

import { optionBClassNames } from "@/components/option-b/theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChordExtractionResult } from "@/types/chords";

interface UrlExtractionFormProps {
  url: string;
  onUrlChange: (value: string) => void;
  onAnalyze: () => Promise<void> | void;
  onSwitchToOcr: () => void;
  isLoading: boolean;
  result: ChordExtractionResult | null;
}

export function UrlExtractionForm({
  url,
  onUrlChange,
  onAnalyze,
  onSwitchToOcr,
  isLoading,
  result,
}: UrlExtractionFormProps) {
  return (
    <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface-soft)] shadow-[var(--song-shadow)]">
      <CardHeader>
        <CardTitle className={`${optionBClassNames.display} text-3xl font-bold text-[var(--song-text)]`}>
          Web extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webSourceUrl" className={`${optionBClassNames.body} text-[var(--song-text)]`}>
            Lyrics + chords page URL
          </Label>
          <Input
            id="webSourceUrl"
            placeholder="https://..."
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            className="rounded-xl border-[var(--song-border)] bg-[var(--song-surface)]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className={`${optionBClassNames.body} rounded-xl bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent)]/90`}
            onClick={onAnalyze}
            disabled={isLoading || !url.trim()}
          >
            {isLoading ? "Analyzing..." : "Analyze the page"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-highlight)] text-[var(--song-text)] hover:bg-[var(--song-surface-muted)]`}
            onClick={onSwitchToOcr}
          >
            Switch to OCR mode (upload)
          </Button>
        </div>

        {result ? (
          <div
            className={`space-y-1 border p-3 text-sm ${
              result.success
                ? "rounded-xl border-[var(--song-border)] bg-[var(--song-surface)] text-[var(--song-text)]"
                : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}
          >
            <p className="font-semibold">
              {result.success
                ? "Web extraction succeeded"
                : result.fallbackUsed
                  ? "Web extraction failed, OCR recommended"
                  : "Web extraction failed"}
            </p>
            <p>{result.message}</p>
            <p className={result.success ? "text-[var(--song-text-muted)]" : ""}>
              Mode: {result.mode}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
