"use client";

import { Loader2 } from "lucide-react";
import { optionBClassNames } from "@/components/option-b/theme";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateCardProps {
  label?: string;
  lines?: number;
}

export function LoadingStateCard({
  label = "Chargement en cours...",
  lines = 3,
}: LoadingStateCardProps) {
  return (
    <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
      <CardContent className="space-y-4 pt-6">
        <p
          className={`${optionBClassNames.body} inline-flex items-center gap-2 text-sm font-medium text-[var(--song-text-muted)]`}
        >
          <Loader2 className="size-4 animate-spin text-[var(--song-text-subtle)]" />
          {label}
        </p>
        <div className="space-y-2">
          {Array.from({ length: Math.max(lines, 1) }).map((_, index) => (
            <div
              key={`loading-line-${index}`}
              className="h-8 animate-pulse rounded-md border border-[var(--song-border-soft)] bg-[var(--song-surface-soft)]"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
