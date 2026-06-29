"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ExtractionResultView } from "@/components/chords/extraction-result-view";
import { SourceModeTabs } from "@/components/chords/source-mode-tabs";
import { UrlExtractionForm } from "@/components/chords/url-extraction-form";
import { optionBClassNames } from "@/components/option-b/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { preprocessImageForOCR } from "@/lib/utils/image-compress";
import type { ChordExtractionResult, StructuredSong } from "@/types/chords";

interface OCRTokenReviewItem {
  text: string;
  confidence: number;
  lineIndex: number;
  wordIndex: number;
  isChordRecognized: boolean;
  isSuspect: boolean;
  correctionSuggestion: string | null;
}

interface OCRReviewWorkspaceProps {
  sourceSongId?: string;
  initialImageUrl?: string;
  initialOCRImportId?: string;
}

type OCRProvider = "ocr.space" | "google.vision";
type OCRProviderDetectMode = OCRProvider | "auto.compare";
type SourceTabMode = "web" | "ocr";
type CreationMode = "web" | "ocr";

interface OCRProviderRunSummary {
  ok: boolean;
  recognizedChordCount?: number;
  lineCount?: number;
  error?: string;
}

interface OCRComparisonSummary {
  mode: "auto.compare";
  selectedProvider: OCRProvider;
  ocrSpace: OCRProviderRunSummary;
  googleVision: OCRProviderRunSummary;
}

function toEditableChordLinesFromStructuredSong(song: StructuredSong): string[] {
  const lines: string[] = [];
  for (const section of song.sections) {
    for (const line of section.lines) {
      if (line.kind === "lyrics_only") {
        continue;
      }

      // Prefer normalized chord tokens so split accidentals/modifiers from raw OCR/HTML
      // cannot leak into the validated text (e.g. "G #", "F # m", "E +").
      const chordLine =
        line.chords.length > 0
          ? line.chords.join(" ")
          : line.kind === "lyrics_with_chords"
            ? (line.rawChords ?? "")
            : (line.raw ?? "");

      const normalizedChords = chordLine.replace(/\s+/g, " ").trim();
      if (normalizedChords) {
        lines.push(normalizedChords);
      }
    }
  }

  return lines;
}

export function OCRReviewWorkspace({
  sourceSongId,
  initialImageUrl = "",
  initialOCRImportId,
}: OCRReviewWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceMode, setSourceMode] = useState<SourceTabMode>(
    initialImageUrl ? "ocr" : "web",
  );
  const [creationMode, setCreationMode] = useState<CreationMode>(
    initialImageUrl ? "ocr" : "web",
  );

  const [webUrl, setWebUrl] = useState("");
  const [webResult, setWebResult] = useState<ChordExtractionResult | null>(null);
  const [isWebExtracting, setIsWebExtracting] = useState(false);

  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [ocrImportId, setOCRImportId] = useState<string | null>(
    initialOCRImportId ?? null,
  );
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [originalKey, setOriginalKey] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [tokens, setTokens] = useState<OCRTokenReviewItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chordsOnly, setChordsOnly] = useState(true);
  const [provider, setProvider] = useState<OCRProviderDetectMode>("ocr.space");
  const [comparison, setComparison] = useState<OCRComparisonSummary | null>(null);
  const [showAllTokens, setShowAllTokens] = useState(false);

  const validatedText = useMemo(() => lines.join("\n").trim(), [lines]);
  const tokenSummary = useMemo(() => {
    const recognized = tokens.filter((token) => token.isChordRecognized).length;
    const suspect = tokens.filter((token) => token.isSuspect).length;
    return {
      total: tokens.length,
      recognized,
      suspect,
    };
  }, [tokens]);
  const visibleTokens = useMemo(
    () => (showAllTokens ? tokens : tokens.slice(0, 40)),
    [showAllTokens, tokens],
  );
  const hiddenTokenCount = Math.max(tokens.length - visibleTokens.length, 0);
  const detectingLabel =
    provider === "auto.compare"
      ? "Comparing OCR providers..."
      : provider === "google.vision"
        ? "Analyzing with Google Vision..."
        : "Analyzing with OCR.space...";

  async function handleWebExtraction() {
    setIsWebExtracting(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/chord-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webUrl,
          preferredMode: "web",
          sourceSongId: sourceSongId ?? null,
          persistResult: true,
        }),
      });

      const payload = (await response.json()) as {
        data?: ChordExtractionResult;
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Web extraction failed");
      }

      setWebResult(payload.data);

      if (payload.data.success && payload.data.song) {
        const structuredLines = toEditableChordLinesFromStructuredSong(payload.data.song);
        setLines(structuredLines);
        setTokens([]);
        setCreationMode("web");
        if (!title.trim()) setTitle(payload.data.song.title);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start web extraction",
      );
    } finally {
      setIsWebExtracting(false);
    }
  }

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const uploadFile = file.type.startsWith("image/")
        ? await preprocessImageForOCR(file)
        : file;

      const formData = new FormData();
      formData.append("file", uploadFile);
      if (sourceSongId) formData.append("songId", sourceSongId);

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
      setImageUrl(payload.data.imageUrl);
      setOCRImportId(payload.data.ocrImportId);
      setSourceMode("ocr");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error during upload",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDetect() {
    setIsDetecting(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/ocr/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ocrImportId,
          imageUrl,
          songId: sourceSongId ?? undefined,
          provider,
          chordsOnly,
        }),
      });
      const payload = (await response.json()) as {
        data?: {
          ocrImportId: string;
          providerUsed: OCRProvider;
          comparison?: OCRComparisonSummary;
          lines: string[];
          tokens: OCRTokenReviewItem[];
        };
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "OCR detection failed");
      }
      setOCRImportId(payload.data.ocrImportId);
      setLines(payload.data.lines);
      setTokens(payload.data.tokens);
      setShowAllTokens(false);
      setComparison(payload.data.comparison ?? null);
      setCreationMode("ocr");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to start OCR detection",
      );
    } finally {
      setIsDetecting(false);
    }
  }

  async function handleFinalize() {
    setIsFinalizing(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/ocr/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ocrImportId,
          songId: sourceSongId ?? undefined,
          title,
          artist: artist.trim() ? artist : null,
          originalKey: originalKey.trim() ? originalKey : null,
          sourceType: creationMode === "web" ? "web_page" : "ocr_image",
          notationPreference: "auto",
          validatedText,
          reviewStatus: "validated",
        }),
      });
      const payload = (await response.json()) as {
        data?: { songId: string };
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to finalize");
      }
      window.location.href = `/songs/${payload.data.songId}`;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Error during OCR finalization",
      );
    } finally {
      setIsFinalizing(false);
    }
  }

  function useWebResultForCreation() {
    if (!webResult?.song) return;
    setLines(toEditableChordLinesFromStructuredSong(webResult.song));
    if (!title.trim()) setTitle(webResult.song.title);
    setCreationMode("web");
  }

  const manualFallbackHref = sourceSongId
    ? `/songs/${sourceSongId}`
    : "/songs/new";

  return (
    <div className={`${optionBClassNames.body} space-y-6 text-[var(--song-text)]`}>
      <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
        <CardHeader className="space-y-3">
          <CardTitle className={`${optionBClassNames.display} text-4xl font-bold`}>
            Smart import: chords + lyrics
          </CardTitle>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">mode used: {creationMode}</Badge>
            <Badge variant="outline">
              status: {webResult?.success ? "web ok" : tokens.length > 0 ? "ocr ok" : "pending"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={sourceMode}
            onValueChange={(value) => setSourceMode(value as SourceTabMode)}
          >
            <SourceModeTabs value={sourceMode} onValueChange={setSourceMode} />

            <TabsContent value="web" className="mt-4 space-y-4">
              <UrlExtractionForm
                url={webUrl}
                onUrlChange={setWebUrl}
                onAnalyze={handleWebExtraction}
                onSwitchToOcr={() => setSourceMode("ocr")}
                isLoading={isWebExtracting}
                result={webResult}
              />

              {webResult ? <ExtractionResultView result={webResult} /> : null}

              {webResult?.success && webResult.song ? (
                <Button type="button" onClick={useWebResultForCreation}>
                  Use this result to create the song
                </Button>
              ) : null}
            </TabsContent>

            <TabsContent value="ocr" className="mt-4 space-y-6">
              <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface-soft)] shadow-[var(--song-shadow)]">
                <CardHeader>
                  <CardTitle className={`${optionBClassNames.display} text-3xl font-bold`}>
                    Assisted OCR (OCR.space / Google Vision)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[var(--song-text-muted)]">
                    Use OCR as a fallback if the web page can&apos;t be used.
                  </p>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="imageUrl">Image/PDF URL (or upload below)</Label>
                        <Input
                          id="imageUrl"
                          placeholder="https://..."
                          value={imageUrl}
                          onChange={(event) => setImageUrl(event.target.value)}
                          className="rounded-xl border-[var(--song-border)] bg-[var(--song-surface)]"
                        />
                      </div>
                      <div className="w-full space-y-2 sm:w-64">
                        <Label htmlFor="ocrProvider">OCR provider</Label>
                        <select
                          id="ocrProvider"
                          className="w-full rounded-xl border border-[var(--song-border)] bg-[var(--song-surface)] px-3 py-2 text-sm"
                          value={provider}
                          onChange={(event) =>
                            setProvider(event.target.value as OCRProviderDetectMode)
                          }
                        >
                          <option value="ocr.space">OCR.space</option>
                          <option value="google.vision">Google Vision</option>
                          <option value="auto.compare">
                            Auto compare (OCR.space + Google Vision)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[var(--song-text-subtle)]">
                      <div className="h-px flex-1 bg-[var(--song-border)]" />
                      <span>or</span>
                      <div className="h-px flex-1 bg-[var(--song-border)]" />
                    </div>

                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf,.pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-[var(--song-border)] bg-[var(--song-surface-highlight)] text-[var(--song-text)] hover:bg-[var(--song-surface-muted)]"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Upload image or PDF"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="chordsOnly"
                      type="checkbox"
                      checked={chordsOnly}
                      onChange={(event) => setChordsOnly(event.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="chordsOnly" className="cursor-pointer">
                      Extract only recognized chords
                    </Label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={handleDetect}
                      className="rounded-xl bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent)]/90"
                      disabled={isDetecting || !imageUrl.trim()}
                    >
                      {isDetecting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          {detectingLabel}
                        </span>
                      ) : (
                        "Run OCR"
                      )}
                    </Button>
                    <Link href={manualFallbackHref}>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-[var(--song-border)] bg-[var(--song-surface-highlight)] text-[var(--song-text)] hover:bg-[var(--song-surface-muted)]"
                      >
                        Manual entry
                      </Button>
                    </Link>
                  </div>
                  {isDetecting ? (
                    <div className="rounded-xl border border-[var(--song-border)] bg-[var(--song-bg)] px-3 py-2">
                      <div className="h-1.5 overflow-hidden rounded-sm bg-[var(--song-surface-muted)]">
                        <div className="h-full w-1/3 animate-pulse bg-[var(--song-accent)]/75" />
                      </div>
                    </div>
                  ) : null}
                  {comparison ? (
                    <div className="rounded-xl border border-[var(--song-border)] bg-[var(--song-surface)] p-3 text-sm">
                      <p className="font-medium">
                        Auto compare: chosen provider = {comparison.selectedProvider}
                      </p>
                      <p className="text-[var(--song-text-muted)]">
                        OCR.space:{" "}
                        {comparison.ocrSpace.ok
                          ? `${comparison.ocrSpace.recognizedChordCount ?? 0} chords, ${comparison.ocrSpace.lineCount ?? 0} lines`
                          : `error (${comparison.ocrSpace.error ?? "unknown"})`}
                      </p>
                      <p className="text-[var(--song-text-muted)]">
                        Google Vision:{" "}
                        {comparison.googleVision.ok
                          ? `${comparison.googleVision.recognizedChordCount ?? 0} chords, ${comparison.googleVision.lineCount ?? 0} lines`
                          : `error (${comparison.googleVision.error ?? "unknown"})`}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
                <CardHeader>
                  <CardTitle className={`${optionBClassNames.display} text-3xl font-bold`}>
                    Tokens OCR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isDetecting ? (
                    <div className="space-y-3">
                      <p className="inline-flex items-center gap-2 text-sm text-[var(--song-text-muted)]">
                        <Loader2 className="size-4 animate-spin" />
                        OCR processing...
                      </p>
                      <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div
                            key={`skeleton-token-${index}`}
                            className="h-9 animate-pulse rounded-md border border-[var(--song-border-soft)] bg-[var(--song-bg)]"
                          />
                        ))}
                      </div>
                    </div>
                  ) : tokens.length === 0 ? (
                    <p className="text-sm text-[var(--song-text-muted)]">
                      Run OCR to see the detected tokens.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--song-border-soft)] bg-[var(--song-bg)] px-3 py-2 text-xs">
                        <p className="text-[var(--song-text-muted)]">
                          {tokenSummary.total} tokens - {tokenSummary.recognized} recognized -{" "}
                          {tokenSummary.suspect} suspect
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-xl border-[var(--song-border)] bg-[var(--song-surface)] px-2 text-xs text-[var(--song-text)] hover:bg-[var(--song-surface-highlight)]"
                          onClick={() => setShowAllTokens((value) => !value)}
                          disabled={tokens.length <= 40}
                        >
                          {showAllTokens
                            ? "Collapse"
                            : hiddenTokenCount > 0
                              ? `Show more (${hiddenTokenCount})`
                              : "All shown"}
                        </Button>
                      </div>
                      <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                        {visibleTokens.map((token, index) => (
                          <div
                            key={`${token.lineIndex}-${token.wordIndex}-${index}`}
                            className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--song-border-soft)] bg-[var(--song-surface-soft)] p-2 text-xs"
                          >
                            <span className="font-semibold text-[var(--song-text)]">
                              {token.text}
                            </span>
                            <Badge
                              variant={token.isChordRecognized ? "secondary" : "destructive"}
                              className="text-[10px]"
                            >
                              {token.isChordRecognized ? "recognized" : "unknown"}
                            </Badge>
                            <Badge
                              variant={token.isSuspect ? "outline" : "secondary"}
                              className="text-[10px]"
                            >
                              {token.isSuspect ? "suspect" : "reliable"}
                            </Badge>
                            <span className="text-[var(--song-text-subtle)]">
                              conf: {Math.round(token.confidence)}%
                            </span>
                            {token.correctionSuggestion ? (
                              <span className="text-[var(--song-text-subtle)]">
                                suggestion: {token.correctionSuggestion}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
        <CardHeader>
          <CardTitle className={`${optionBClassNames.display} text-3xl font-bold`}>
            Validated text (editable)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.length === 0 ? (
            <p className="text-sm text-[var(--song-text-muted)]">
              The extracted text will appear here after web or OCR analysis.
            </p>
          ) : (
            <Textarea
              value={validatedText}
              onChange={(event) => {
                const nextLines = event.target.value
                  .split("\n")
                  .map((line) => line.trimEnd());
                setLines(nextLines);
              }}
              className="min-h-[240px] max-h-[420px] rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)]"
            />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
        <CardHeader>
          <CardTitle className={`${optionBClassNames.display} text-3xl font-bold`}>
            Create the song from the validated result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ocrTitle">Title</Label>
              <Input
                id="ocrTitle"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. My song"
                className="rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ocrArtist">Artist</Label>
              <Input
                id="ocrArtist"
                value={artist}
                onChange={(event) => setArtist(event.target.value)}
                placeholder="Optional"
                className="rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ocrOriginalKey">Original key</Label>
            <Input
              id="ocrOriginalKey"
              value={originalKey}
              onChange={(event) => setOriginalKey(event.target.value)}
              placeholder="Optional (C, F#, Bb...)"
              className="rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)]"
            />
          </div>
          {errorMessage ? (
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
          ) : null}
          <Button
            type="button"
            onClick={handleFinalize}
            className="rounded-xl bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent)]/90"
            disabled={isFinalizing || !title.trim() || !validatedText}
          >
            {isFinalizing ? "Finalizing..." : "Validate and create the song"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
