"use client";

import { optionBClassNames } from "@/components/option-b/theme";
import { Badge } from "@/components/ui/badge";

interface SaveStatusProps {
  status?: "saved" | "saving" | "error";
}

export function SaveStatus({ status = "saved" }: SaveStatusProps) {
  const config = {
    saved: {
      label: "Saved",
      className:
        "border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text-muted)]",
    },
    saving: {
      label: "Saving...",
      className:
        "border-[var(--song-border)] bg-[var(--song-surface-highlight)] text-[var(--song-text)]",
    },
    error: {
      label: "Error",
      className:
        "border-[var(--song-danger-border)] bg-[var(--song-danger-surface)] text-[var(--song-danger)]",
    },
  };

  const { label, className } = config[status];

  return (
    <Badge
      variant="outline"
      className={`${optionBClassNames.body} rounded-full text-xs font-semibold ${className}`}
    >
      {label}
    </Badge>
  );
}
