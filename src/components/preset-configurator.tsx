"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { FingeringHintBadge } from "@/components/fingering-hint-badge";
import { LoadingStateCard } from "@/components/loading-state-card";
import { MiniPiano } from "@/components/mini-piano";
import { optionBClassNames } from "@/components/option-b/theme";
import { SaveStatus } from "@/components/save-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ChordVoicingOptionRow,
  PracticePresetRow,
  UniqueChordRow,
} from "@/lib/types/db";

interface PresetConfiguratorProps {
  songId: string;
  keyContext: string;
  notationPreference: string;
  uniqueChords: UniqueChordRow[];
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

async function fetchApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as { data?: T; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "API error");
  if (!payload.data) throw new Error("Invalid API response");
  return payload.data;
}

function extractFingering(voicing: ChordVoicingOptionRow | null): number[] {
  if (!voicing?.fingering_suggested) return [];
  const rightHand = (voicing.fingering_suggested as { rightHand?: unknown })
    .rightHand;
  return Array.isArray(rightHand)
    ? rightHand.filter((v): v is number => typeof v === "number")
    : [];
}

export function PresetConfigurator({
  songId,
  keyContext,
  notationPreference,
  uniqueChords,
}: PresetConfiguratorProps) {
  const [presets, setPresets] = useState<PracticePresetRow[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetDetail, setPresetDetail] = useState<PresetDetail | null>(null);
  const [chordVoicingOptions, setChordVoicingOptions] = useState<
    Map<string, ChordVoicingOptionRow[]>
  >(new Map());
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPresets = useCallback(async () => {
    try {
      const data = await fetchApi<PracticePresetRow[]>(
        `/api/songs/${songId}/presets`,
      );
      setPresets(data);
      return data;
    } catch {
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

  const loadVoicingOptionsForChord = useCallback(
    async (chord: string) => {
      if (chordVoicingOptions.has(chord)) return;
      try {
        const query = new URLSearchParams({
          chord,
          keyContext,
          handMode: "RH",
        });
        const data = await fetchApi<{
          options: ChordVoicingOptionRow[];
          defaultVoicingOptionId: string | null;
        }>(`/api/songs/${songId}/voicings?${query.toString()}`);
        setChordVoicingOptions((prev) => {
          const next = new Map(prev);
          next.set(chord, data.options);
          return next;
        });
      } catch {
        // noop
      }
    },
    [songId, keyContext, chordVoicingOptions],
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

  useEffect(() => {
    for (const chord of uniqueChords) {
      if (chord.is_supported) {
        loadVoicingOptionsForChord(chord.normalized_chord_symbol);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueChords, songId, keyContext]);

  async function handleCreatePreset() {
    setSaveStatus("saving");
    try {
      const newPreset = await fetchApi<PracticePresetRow>(
        `/api/songs/${songId}/presets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keySnapshot: keyContext,
            notationSnapshot: notationPreference,
          }),
        },
      );
      const updated = await loadPresets();
      setSelectedPresetId(newPreset.id);
      void updated;
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleDeletePreset() {
    if (!selectedPresetId) return;
    setSaveStatus("saving");
    try {
      await fetchApi<{ success: boolean }>(
        `/api/songs/${songId}/presets/${selectedPresetId}`,
        { method: "DELETE" },
      );
      const updated = await loadPresets();
      setSelectedPresetId(updated.length > 0 ? updated[0].id : null);
      setPresetDetail(null);
      setIsDeleteConfirmOpen(false);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleRename() {
    if (!selectedPresetId || !renameValue.trim()) return;
    setSaveStatus("saving");
    try {
      await fetchApi<PracticePresetRow>(
        `/api/songs/${songId}/presets/${selectedPresetId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: renameValue.trim() }),
        },
      );
      await loadPresets();
      setIsRenaming(false);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleVoicingChange(
    chord: string,
    voicingOptionId: string,
  ) {
    if (!selectedPresetId) return;
    setSaveStatus("saving");
    try {
      await fetchApi<unknown>(
        `/api/songs/${songId}/presets/${selectedPresetId}/voicings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chord,
            selectedVoicingOptionId: voicingOptionId,
          }),
        },
      );
      await loadPresetDetail(selectedPresetId);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  function getSelectedVoicingForChord(
    chord: string,
    options: ChordVoicingOptionRow[],
  ): ChordVoicingOptionRow | null {
    if (options.length === 0) return null;
    if (!presetDetail) return options[0] ?? null;

    const sel = presetDetail.selections.find(
      (s) => s.normalized_chord_symbol === chord,
    );

    if (sel?.voicing) return sel.voicing;
    if (sel?.selected_voicing_option_id) {
      const matched = options.find((option) => option.id === sel.selected_voicing_option_id);
      if (matched) return matched;
    }

    return options[0] ?? null;
  }

  function getSelectedVoicingOptionIdForChord(
    chord: string,
    options: ChordVoicingOptionRow[],
  ): string | null {
    if (options.length === 0) return null;
    if (!presetDetail) return options[0]?.id ?? null;

    const sel = presetDetail.selections.find(
      (s) => s.normalized_chord_symbol === chord,
    );

    if (sel?.selected_voicing_option_id) {
      const matched = options.find((option) => option.id === sel.selected_voicing_option_id);
      if (matched) return matched.id;
    }

    return options[0]?.id ?? null;
  }

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const sortedChords = [...uniqueChords]
    .filter((c) => c.is_supported)
    .sort((a, b) => b.occurrence_count - a.occurrence_count);

  if (loading) {
    return <LoadingStateCard label="Loading plans..." lines={4} />;
  }

  return (
    <div className={`${optionBClassNames.body} space-y-6`}>
      <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className={`${optionBClassNames.display} text-4xl font-bold text-[#2d2a24]`}>
              Practice plan
            </CardTitle>
            <SaveStatus status={saveStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {presets.length > 0 ? (
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
            ) : (
              <p className={`${optionBClassNames.body} text-sm text-[#6b6254]`}>
                No practice plan.
              </p>
            )}
            <Button
              size="sm"
              onClick={handleCreatePreset}
              className={`${optionBClassNames.body} rounded-sm bg-[#2d2a24] text-[#f8f4ea] hover:bg-[#2d2a24]/90`}
            >
              New plan
            </Button>
            {selectedPreset ? (
              <>
                {isRenaming ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className={`${optionBClassNames.body} h-8 w-40 rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#3a342b]`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleRename();
                        if (e.key === "Escape") setIsRenaming(false);
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRename}
                      className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#3a342b] hover:bg-[#efe6d6]`}
                    >
                      OK
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsRenaming(false)}
                      className={`${optionBClassNames.body} rounded-sm text-[#5a5246] hover:bg-[#efe6d6]`}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#3a342b] hover:bg-[#efe6d6]`}
                    onClick={() => {
                      setRenameValue(selectedPreset.name);
                      setIsRenaming(true);
                    }}
                  >
                    Rename
                  </Button>
                )}
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#5a5246] hover:bg-[#efe6d6]`}
                    onClick={() => setIsDeleteConfirmOpen((prev) => !prev)}
                    disabled={saveStatus === "saving"}
                    aria-label="Delete plan"
                  >
                    <X className="size-3.5" />
                  </Button>
                  {isDeleteConfirmOpen ? (
                    <div className="absolute top-8 right-0 z-20 w-52 rounded-sm border border-[#d9ccb2] bg-white p-3 shadow-sm">
                      <p className={`${optionBClassNames.body} text-xs text-[#5a5246]`}>
                        Delete this plan?
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className={`${optionBClassNames.body} rounded-sm text-[#5a5246] hover:bg-[#efe6d6]`}
                          onClick={() => setIsDeleteConfirmOpen(false)}
                          disabled={saveStatus === "saving"}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="xs"
                          className={`${optionBClassNames.body} rounded-sm bg-[#7d3e3e] text-[#f8f4ea] hover:bg-[#693434]`}
                          onClick={handleDeletePreset}
                          disabled={saveStatus === "saving"}
                        >
                          {saveStatus === "saving" ? "..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
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
        </CardContent>
      </Card>

      {selectedPreset && sortedChords.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedChords.map((chord) => {
            const options =
              chordVoicingOptions.get(chord.normalized_chord_symbol) ?? [];
            const selectedVoicing = getSelectedVoicingForChord(
              chord.normalized_chord_symbol,
              options,
            );
            const selectedOptionId = getSelectedVoicingOptionIdForChord(
              chord.normalized_chord_symbol,
              options,
            );
            return (
              <Card
                key={chord.id}
                className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]"
              >
                <CardContent className={`${optionBClassNames.body} space-y-3 pt-4`}>
                  <div className="flex items-center justify-between">
                    <span className={`${optionBClassNames.display} text-3xl font-bold text-[#2d2a24]`}>
                      {chord.normalized_chord_symbol}
                    </span>
                    <Badge variant="outline" className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#5a5246]`}>
                      {chord.occurrence_count}x
                    </Badge>
                  </div>
                  {options.length > 0 ? (
                    <Select
                      value={selectedOptionId ?? options[0]?.id ?? ""}
                      onValueChange={(optionId) =>
                        handleVoicingChange(
                          chord.normalized_chord_symbol,
                          optionId,
                        )
                      }
                    >
                      <SelectTrigger
                        className={`${optionBClassNames.body} w-full rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#3a342b]`}
                        size="sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.voicing_label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p
                      className={`${optionBClassNames.body} inline-flex items-center gap-2 text-xs text-[var(--song-text-subtle)]`}
                    >
                      <Loader2 className="size-3 animate-spin" />
                      Loading voicings...
                    </p>
                  )}
                  <MiniPiano
                    activeNotesMidi={selectedVoicing?.notes_midi ?? []}
                  />
                  <FingeringHintBadge
                    fingering={extractFingering(selectedVoicing)}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : selectedPreset ? (
        <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
          <CardContent className={`${optionBClassNames.body} pt-6 text-sm text-[#6b6254]`}>
            No supported chords in this song.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
