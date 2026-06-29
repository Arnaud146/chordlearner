"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Upload } from "lucide-react";
import { optionBClassNames } from "@/components/option-b/theme";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { preprocessImageForOCR } from "@/lib/utils/image-compress";

export function ImportCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFileSelected(file: File) {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const uploadFile = file.type.startsWith("image/")
        ? await preprocessImageForOCR(file)
        : file;
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch("/api/ocr/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        data?: { ocrImportId: string; imageUrl: string };
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Upload failed");
      }

      const params = new URLSearchParams({
        ocrImportId: payload.data.ocrImportId,
        imageUrl: payload.data.imageUrl,
      });
      router.push(`/songs/new/ocr-review?${params.toString()}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Error during upload. Check the file and try again.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="rounded-2xl border border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
      <CardHeader>
        <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}>
          Chart import
        </CardTitle>
        <CardDescription className={`${optionBClassNames.body} text-sm text-[var(--song-text-muted)]`}>
          Choose your import path based on your source.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFileSelected(file);
          }}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--song-border-soft)] bg-[var(--song-surface-soft)] p-3">
            <p className={`${optionBClassNames.body} text-xs font-semibold uppercase tracking-[0.08em] text-[var(--song-text-subtle)]`}>
              OCR (file)
            </p>
            <p className={`${optionBClassNames.body} mt-1 text-sm text-[var(--song-text-muted)]`}>
              Upload an image/PDF - automatic OCR extraction.
            </p>
            <Button
              type="button"
              variant="outline"
              className={`${optionBClassNames.body} mt-3 w-full rounded-xl border-[var(--song-border)] bg-[var(--song-surface-highlight)] font-semibold text-[var(--song-text)] hover:bg-[var(--song-surface-muted)]`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="size-4" />
              {isUploading ? "Uploading..." : "Import a file"}
            </Button>
          </div>

          <div className="rounded-xl border border-[var(--song-border-soft)] bg-[var(--song-surface-soft)] p-3">
            <p className={`${optionBClassNames.body} text-xs font-semibold uppercase tracking-[0.08em] text-[var(--song-text-subtle)]`}>
              Web extraction (URL)
            </p>
            <p className={`${optionBClassNames.body} mt-1 text-sm text-[var(--song-text-muted)]`}>
              Paste a chords/lyrics page URL to extract the text.
            </p>
            <Button
              asChild
              type="button"
              className={`${optionBClassNames.body} mt-3 min-h-[44px] w-full rounded-xl bg-[var(--song-accent)] font-bold text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent-hover)]`}
            >
              <Link href="/songs/new/ocr-review">
                <Globe className="size-4" />
                Open URL extraction
              </Link>
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <p className={`${optionBClassNames.body} text-sm font-medium text-[var(--song-danger)]`}>
            {errorMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
