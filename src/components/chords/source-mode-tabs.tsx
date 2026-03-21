"use client";

import { optionBClassNames } from "@/components/option-b/theme";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SourceModeTabsProps {
  value: "web" | "ocr";
  onValueChange: (value: "web" | "ocr") => void;
}

export function SourceModeTabs({ value, onValueChange }: SourceModeTabsProps) {
  return (
    <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border border-[var(--song-border)] bg-[var(--song-surface-muted)] p-1">
      <TabsTrigger
        value="web"
        data-state={value === "web" ? "active" : "inactive"}
        className={`${optionBClassNames.body} rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-[var(--song-text-muted)] data-[state=active]:border-[var(--song-border)] data-[state=active]:bg-[var(--song-surface)] data-[state=active]:text-[var(--song-text)]`}
        onClick={() => onValueChange("web")}
      >
        Extraction web (URL)
      </TabsTrigger>
      <TabsTrigger
        value="ocr"
        data-state={value === "ocr" ? "active" : "inactive"}
        className={`${optionBClassNames.body} rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-[var(--song-text-muted)] data-[state=active]:border-[var(--song-border)] data-[state=active]:bg-[var(--song-surface)] data-[state=active]:text-[var(--song-text)]`}
        onClick={() => onValueChange("ocr")}
      >
        OCR (upload fichier)
      </TabsTrigger>
    </TabsList>
  );
}
