"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { FingeringHintBadge } from "@/components/fingering-hint-badge";
import { LoadingStateCard } from "@/components/loading-state-card";
import { MiniPiano } from "@/components/mini-piano";
import { optionBClassNames } from "@/components/option-b/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseChordSymbol } from "@/lib/domain/chords/chord-parser";
import { noteToMidi } from "@/lib/domain/voicings/piano-layout";
import { buildChordGridExportModel } from "@/lib/domain/export/chord-grid-export";
import {
  exportChordGridPdf,
  exportChordGridPngPages,
} from "@/lib/utils/chord-grid-export-client";
import {
  exportPracticePlanPdf,
  type PracticePlanExportModel,
} from "@/lib/utils/practice-plan-export";
import type {
  ChordOccurrenceRow,
  ChordVoicingOptionRow,
  NotationPreference,
  PracticePresetRow,
} from "@/lib/types/db";

interface PresetOverviewProps {
  songId: string;
  occurrences: ChordOccurrenceRow[];
  songTitle: string;
  songArtist: string | null;
  currentKey: string | null;
  notationPreference: NotationPreference;
}

interface PresetSelectionWithVoicing {
  normalized_chord_symbol: string;
  selected_voicing_option_id: string;
  voicing: ChordVoicingOptionRow | null;
}

interface PresetDetail {
  preset: PracticePresetRow;
  selections: PresetSelectionWithVoicing[];
}

interface TransitionGroup {
  chords: string[];
  occurrences: number;
}

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = (await response.json()) as { data?: T; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "API error");
  if (!payload.data) throw new Error("Invalid API response");
  return payload.data;
}

function getSlashBass(symbol: string): { note: string; midi: number } | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed.slashBass) return null;
  try {
    return { note: parsed.slashBass, midi: noteToMidi(parsed.slashBass, 3) };
  } catch {
    return null;
  }
}

function extractFingering(voicing: ChordVoicingOptionRow | null): number[] {
  if (!voicing?.fingering_suggested) return [];
  const rightHand = (voicing.fingering_suggested as { rightHand?: unknown })
    .rightHand;
  return Array.isArray(rightHand)
    ? rightHand.filter((v): v is number => typeof v === "number")
    : [];
}

function sortOccurrences(occurrences: ChordOccurrenceRow[]): ChordOccurrenceRow[] {
  return [...occurrences].sort((a, b) => {
    if (a.line_index !== b.line_index) return a.line_index - b.line_index;
    return a.token_index - b.token_index;
  });
}

function dedupeConsecutive(values: string[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (result.length === 0 || result[result.length - 1] !== value) {
      result.push(value);
    }
  }
  return result;
}

function buildUniqueTransitionGroupsByValidatedLines(
  values: ChordOccurrenceRow[],
): TransitionGroup[] {
  const rowsByLine = new Map<number, ChordOccurrenceRow[]>();
  for (const occurrence of sortOccurrences(values)) {
    const line = rowsByLine.get(occurrence.line_index) ?? [];
    line.push(occurrence);
    rowsByLine.set(occurrence.line_index, line);
  }

  const groupsByLine = Array.from(rowsByLine.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, rows]) => rows);

  const signatures: string[] = [];
  const grouped = new Map<string, TransitionGroup>();

  for (const rowGroup of groupsByLine) {
    const symbols = rowGroup.map((occurrence) => occurrence.normalized_chord_symbol);
    if (symbols.length < 2) continue;

    const signature = symbols.join(" -> ");
    const existing = grouped.get(signature);
    if (existing) {
      existing.occurrences += 1;
      continue;
    }
    signatures.push(signature);
    grouped.set(signature, {
      chords: symbols,
      occurrences: 1,
    });
  }

  return signatures
    .map((signature) => grouped.get(signature))
    .filter((group): group is TransitionGroup => Boolean(group));
}

export function PresetOverview({
  songId,
  occurrences,
  songTitle,
  songArtist,
  currentKey,
  notationPreference,
}: PresetOverviewProps) {
  const [presets, setPresets] = useState<PracticePresetRow[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetDetail, setPresetDetail] = useState<PresetDetail | null>(null);
  const [fallbackVoicingsByChord, setFallbackVoicingsByChord] = useState<
    Map<string, ChordVoicingOptionRow[]>
  >(new Map());
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPlan, setIsExportingPlan] = useState(false);
  const [exportNotice, setExportNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPresets = useCallback(async () => {
    try {
      const data = await fetchApi<PracticePresetRow[]>(
        `/api/songs/${songId}/presets`,
      );
      setPresets(data);
      return data;
    } catch {
      setPresets([]);
      return [];
    }
  }, [songId]);

  const loadPresetDetail = useCallback(
    async (presetId: string) => {
      try {
        const data = await fetchApi<PresetDetail>(
          `/api/songs/${songId}/presets/${presetId}`,
        );
        setPresetDetail(data);
      } catch {
        setPresetDetail(null);
      }
    },
    [songId],
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      const data = await loadPresets();
      if (cancelled) return;
      if (data.length > 0 && !selectedPresetId) {
        setSelectedPresetId(data[0].id);
      }
      setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId]);

  useEffect(() => {
    if (!selectedPresetId) return;
    loadPresetDetail(selectedPresetId);
  }, [selectedPresetId, loadPresetDetail]);

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const voicingMap = useMemo(() => {
    const map = new Map<string, ChordVoicingOptionRow>();
    if (!presetDetail) return map;
    for (const sel of presetDetail.selections) {
      if (sel.voicing) {
        map.set(sel.normalized_chord_symbol, sel.voicing);
      }
    }
    return map;
  }, [presetDetail]);

  const orderedOccurrences = useMemo(() => {
    return sortOccurrences(occurrences);
  }, [occurrences]);

  const progressionSymbols = useMemo(() => {
    const ordered = orderedOccurrences.map(
      (occurrence) => occurrence.normalized_chord_symbol,
    );
    return dedupeConsecutive(ordered);
  }, [orderedOccurrences]);

  const occurrenceCountBySymbol = useMemo(() => {
    const map = new Map<string, number>();
    for (const occurrence of orderedOccurrences) {
      const symbol = occurrence.normalized_chord_symbol;
      map.set(symbol, (map.get(symbol) ?? 0) + 1);
    }
    return map;
  }, [orderedOccurrences]);

  const uniqueSymbols = useMemo(() => {
    return Array.from(new Set(progressionSymbols));
  }, [progressionSymbols]);

  const transitionGroups = useMemo(() => {
    return buildUniqueTransitionGroupsByValidatedLines(orderedOccurrences);
  }, [orderedOccurrences]);

  const exportModel = useMemo(
    () =>
      buildChordGridExportModel({
        occurrences: orderedOccurrences,
        songTitle,
        songArtist,
        currentKey,
        notationPreference,
        linesPerPage: 24,
      }),
    [orderedOccurrences, songTitle, songArtist, currentKey, notationPreference],
  );

  const canExport = exportModel.lines.length > 0 && !loading;

  useEffect(() => {
    if (!selectedPreset) return;
    const presetKeySnapshot = selectedPreset.key_snapshot;

    const missing = uniqueSymbols.filter(
      (symbol) =>
        !voicingMap.has(symbol) &&
        !(fallbackVoicingsByChord.get(symbol)?.length),
    );
    if (missing.length === 0) return;

    let cancelled = false;

    async function loadFallbackVoicings() {
      const entries = await Promise.all(
        missing.map(async (symbol) => {
          try {
            const query = new URLSearchParams({
              chord: symbol,
              keyContext: presetKeySnapshot,
              handMode: "RH",
            });
            const data = await fetchApi<{
              options: ChordVoicingOptionRow[];
              defaultVoicingOptionId: string | null;
            }>(`/api/songs/${songId}/voicings?${query.toString()}`);
            return [symbol, data.options] as const;
          } catch {
            return [symbol, [] as ChordVoicingOptionRow[]] as const;
          }
        }),
      );

      if (cancelled) return;

      setFallbackVoicingsByChord((prev) => {
        const next = new Map(prev);
        for (const [symbol, options] of entries) {
          next.set(symbol, options);
        }
        return next;
      });
    }

    void loadFallbackVoicings();

    return () => {
      cancelled = true;
    };
  }, [songId, selectedPreset, uniqueSymbols, voicingMap, fallbackVoicingsByChord]);

  function getResolvedVoicing(symbol: string): ChordVoicingOptionRow | null {
    const selected = voicingMap.get(symbol);
    if (selected) return selected;
    const fallback = fallbackVoicingsByChord.get(symbol) ?? [];
    return fallback[0] ?? null;
  }

  async function handleExportPdf() {
    setExportNotice(null);
    setIsExportingPdf(true);
    try {
      await exportChordGridPdf(exportModel);
      setExportNotice({
        kind: "success",
        message: "PDF export complete.",
      });
    } catch (error) {
      setExportNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to export the chart to PDF.",
      });
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportPng() {
    setExportNotice(null);
    setIsExportingPng(true);
    try {
      await exportChordGridPngPages(exportModel);
      setExportNotice({
        kind: "success",
        message:
          exportModel.pages.length > 1
            ? `PNG export complete (${exportModel.pages.length} pages).`
            : "PNG export complete.",
      });
    } catch (error) {
      setExportNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to export the chart to PNG.",
      });
    } finally {
      setIsExportingPng(false);
    }
  }

  async function handleExportPracticePlan() {
    setExportNotice(null);
    setIsExportingPlan(true);
    try {
      const planChords = uniqueSymbols.map((symbol) => {
        const voicing = getResolvedVoicing(symbol);
        const fingering = extractFingering(voicing);
        const slashBass = getSlashBass(symbol);
        return {
          symbol,
          occurrenceCount: occurrenceCountBySymbol.get(symbol) ?? 0,
          notesMidi: voicing?.notes_midi ?? [],
          slashBassMidi: slashBass?.midi ?? null,
          fingering,
        };
      });

      const planModel: PracticePlanExportModel = {
        title: songTitle,
        artist: songArtist?.trim() || "Unknown artist",
        key: currentKey ?? "Not set",
        notation: notationPreference,
        chords: planChords,
        transitions: transitionGroups,
      };

      await exportPracticePlanPdf(planModel);
      setExportNotice({ kind: "success", message: "Practice plan exported." });
    } catch (error) {
      setExportNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to export the practice plan.",
      });
    } finally {
      setIsExportingPlan(false);
    }
  }

  if (loading) {
    return <LoadingStateCard label="Loading overview..." lines={4} />;
  }

  if (presets.length === 0) {
    return (
      <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
        <CardContent className={`${optionBClassNames.body} pt-6 text-sm text-[#6b6254]`}>
          No practice plan created yet. Go to the
          &laquo;&nbsp;Configure&nbsp;&raquo; tab to create one.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${optionBClassNames.body} space-y-6`}>
      <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle
              className={`${optionBClassNames.display} text-4xl font-bold text-[#2d2a24]`}
            >
              Overview
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#3a342b] hover:bg-[#efe6d6]`}
                onClick={() => void handleExportPdf()}
                disabled={!canExport || isExportingPdf || isExportingPng}
              >
                <Download className="size-3.5" />
                {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#3a342b] hover:bg-[#efe6d6]`}
                onClick={() => void handleExportPng()}
                disabled={!canExport || isExportingPdf || isExportingPng}
              >
                <Download className="size-3.5" />
                {isExportingPng ? "Exporting PNG..." : "Export PNG"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#3a342b] hover:bg-[#efe6d6]`}
                onClick={() => void handleExportPracticePlan()}
                disabled={!canExport || isExportingPdf || isExportingPng || isExportingPlan}
              >
                <Download className="size-3.5" />
                {isExportingPlan ? "Exporting..." : "Practice Plan"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedPresetId ?? ""}
              onValueChange={setSelectedPresetId}
            >
              <SelectTrigger
                className={`${optionBClassNames.body} w-[220px] rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#3a342b]`}
              >
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPreset ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#5a5246]`}>
                  Key: {selectedPreset.key_snapshot}
                </Badge>
                <Badge variant="outline" className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#5a5246]`}>
                  Notation: {selectedPreset.notation_snapshot}
                </Badge>
              </div>
            ) : null}
          </div>
          {!canExport ? (
            <p className={`${optionBClassNames.body} text-xs text-[#6b6254]`}>
              Export unavailable: no chord lines to export.
            </p>
          ) : null}
          {exportNotice ? (
            <p
              className={`${optionBClassNames.body} text-xs ${
                exportNotice.kind === "success" ? "text-[#3f392f]" : "text-[#7d3e3e]"
              }`}
            >
              {exportNotice.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {selectedPreset && presetDetail ? (
        <>
          <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className={`${optionBClassNames.display} text-3xl font-bold text-[#2d2a24]`}>
                  Chords to learn (unique)
                </CardTitle>
                <Badge variant="outline" className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#5a5246]`}>{uniqueSymbols.length} distinct chords</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {uniqueSymbols.length === 0 ? (
                <p className={`${optionBClassNames.body} text-sm text-[#6b6254]`}>
                  No chords found.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {uniqueSymbols.map((symbol) => {
                    const voicing = getResolvedVoicing(symbol);
                    const fingering = extractFingering(voicing);
                    const slashBass = getSlashBass(symbol);
                    return (
                      <div
                        key={symbol}
                        className="flex flex-col items-center gap-2 rounded-sm border border-[#d9ccb2] bg-[#fefcf8] p-3"
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className={`${optionBClassNames.display} text-4xl font-bold text-[#2d2a24]`}>
                            {symbol}
                          </span>
                          <Badge variant="outline" className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-white text-[#5a5246]`}>
                            {occurrenceCountBySymbol.get(symbol) ?? 0}x
                          </Badge>
                        </div>
                        <MiniPiano
                          activeNotesMidi={voicing?.notes_midi ?? []}
                          slashBassMidi={slashBass?.midi ?? null}
                        />
                        <FingeringHintBadge fingering={fingering} />
                        {slashBass ? (
                          <span className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--song-bass)] bg-[var(--song-bass-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--song-bass-foreground)]">
                            <span className="inline-block size-2 rounded-full bg-[var(--song-bass)]" />
                            Left-hand bass: {slashBass.note}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className={`${optionBClassNames.display} text-3xl font-bold text-[#2d2a24]`}>
                  Transitions (grouped by lines)
                </CardTitle>
                <Badge variant="outline" className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#5a5246]`}>{transitionGroups.length} unique blocks</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {transitionGroups.length === 0 ? (
                <p className={`${optionBClassNames.body} text-sm text-[#6b6254]`}>
                  Not enough lines with detected transitions.
                </p>
              ) : (
                <>
                  <p className={`${optionBClassNames.body} text-xs text-[#6b6254]`}>
                    Transitions are shown without voicing or fingering suggestions.
                  </p>
                  {transitionGroups.map((group, chunkIndex) => (
                    <div
                      key={`chunk-${chunkIndex}`}
                      className="space-y-3 rounded-sm border border-[#d9ccb2] bg-[#fefcf8] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`${optionBClassNames.body} text-sm font-semibold text-[#3f392f]`}>
                          Block {chunkIndex + 1}
                        </p>
                        <Badge variant="outline" className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#5a5246]`}>{group.occurrences}x in the song</Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <div className="flex min-w-max items-center gap-2">
                          {group.chords.map((symbol, chordIndex) => (
                            <div
                              key={`${chunkIndex}-${symbol}-${chordIndex}`}
                              className="flex items-center gap-2"
                            >
                              <span className="flex min-w-28 items-center justify-center rounded-sm border border-[#d2c6ae] bg-white px-3 py-2">
                                <span
                                  className={`${optionBClassNames.display} text-3xl font-bold text-[#2d2a24]`}
                                >
                                  {symbol}
                                </span>
                              </span>
                              {chordIndex < group.chords.length - 1 ? (
                                <span className="text-[#8e8068]">&rarr;</span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`${optionBClassNames.body} flex flex-wrap gap-1 text-xs text-[#6b6254]`}>
                        {group.chords.map((symbol, index) => (
                          <span key={`${chunkIndex}-plain-${index}`}>
                            {symbol}
                            {index < group.chords.length - 1 ? " -> " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

