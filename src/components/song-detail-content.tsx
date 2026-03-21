"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  optionBBodyFont,
  optionBClassNames,
  optionBDisplayFont,
} from "@/components/option-b/theme";
import { FingeringHintBadge } from "@/components/fingering-hint-badge";
import { InversionSelector } from "@/components/inversion-selector";
import { KeySelector } from "@/components/key-selector";
import { LoadingStateCard } from "@/components/loading-state-card";
import { PianoKeyboardVisualizer } from "@/components/piano-keyboard-visualizer";
import { PresetConfigurator } from "@/components/preset-configurator";
import { PresetOverview } from "@/components/preset-overview";
import { SaveStatus } from "@/components/save-status";
import { UniqueChordList } from "@/components/unique-chord-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { noteToMidi } from "@/lib/domain/voicings/piano-layout";
import { transposeChordSymbol } from "@/lib/domain/transposition/transpose-chord";
import { getSemitoneDelta } from "@/lib/domain/transposition/transpose-note";
import type {
  ChordOccurrenceRow,
  ChordVoicingOptionRow,
  NotationPreference,
  SongRow,
  UniqueChordRow,
  UserVoicingSelectionRow,
} from "@/lib/types/db";

interface SongDetailContentProps {
  song: SongRow;
}

async function fetchApiData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = (await response.json()) as { data?: T; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Erreur API");
  if (!payload.data) throw new Error("Reponse API invalide");
  return payload.data;
}

export function SongDetailContent({ song }: SongDetailContentProps) {
  const [baseOccurrences, setBaseOccurrences] = useState<ChordOccurrenceRow[]>([]);
  const [baseUniqueChords, setBaseUniqueChords] = useState<UniqueChordRow[]>([]);
  const [voicingOptions, setVoicingOptions] = useState<ChordVoicingOptionRow[]>([]);
  const [selectedVoicingOptionId, setSelectedVoicingOptionId] = useState<
    string | null
  >(null);
  const [currentKey, setCurrentKey] = useState<string | null>(song.current_key);
  const [notationPreference, setNotationPreference] = useState<NotationPreference>(
    song.notation_preference,
  );
  const [selectedChordSymbol, setSelectedChordSymbol] = useState<string | null>(
    null,
  );
  const [selectedInversionIndex, setSelectedInversionIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error"
  >("saved");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "accords" | "configurer" | "overview"
  >("accords");
  const [transposeNotice, setTransposeNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const transposeNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const baseKey = song.original_key ?? song.current_key ?? "C";
  const keyContext = currentKey ?? baseKey;
  const semitoneDelta = useMemo(
    () => getSemitoneDelta(baseKey, keyContext),
    [baseKey, keyContext],
  );

  function showTransposeNotice(kind: "success" | "error", message: string) {
    if (transposeNoticeTimeoutRef.current) {
      clearTimeout(transposeNoticeTimeoutRef.current);
    }
    setTransposeNotice({ kind, message });
    transposeNoticeTimeoutRef.current = setTimeout(() => {
      setTransposeNotice(null);
      transposeNoticeTimeoutRef.current = null;
    }, 2600);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [occData, uniqData] = await Promise.all([
          fetchApiData<ChordOccurrenceRow[]>(
            `/api/songs/${song.id}/chords/occurrences`,
          ),
          fetchApiData<UniqueChordRow[]>(`/api/songs/${song.id}/chords/unique`),
        ]);
        if (cancelled) return;
        setBaseOccurrences(occData);
        setBaseUniqueChords(uniqData);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossible de charger la grille",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [song.id]);

  useEffect(() => {
    return () => {
      if (transposeNoticeTimeoutRef.current) {
        clearTimeout(transposeNoticeTimeoutRef.current);
      }
    };
  }, []);

  const occurrences = useMemo(() => {
    return baseOccurrences.map((occurrence) => {
      const symbol = transposeChordSymbol({
        chordSymbol: occurrence.normalized_chord_symbol,
        semitoneDelta,
        notationPreference,
        targetKey: keyContext,
      });
      const base = transposeChordSymbol({
        chordSymbol: occurrence.base_chord_normalized,
        semitoneDelta,
        notationPreference,
        targetKey: keyContext,
      });
      const slash = occurrence.slash_bass
        ? transposeChordSymbol({
            chordSymbol: occurrence.slash_bass,
            semitoneDelta,
            notationPreference,
            targetKey: keyContext,
          })
        : null;
      return {
        ...occurrence,
        normalized_chord_symbol: symbol,
        base_chord_normalized: base,
        slash_bass: slash,
      };
    });
  }, [baseOccurrences, keyContext, notationPreference, semitoneDelta]);

  const uniqueChords = useMemo(() => {
    return baseUniqueChords.map((chord) => {
      const symbol = transposeChordSymbol({
        chordSymbol: chord.normalized_chord_symbol,
        semitoneDelta,
        notationPreference,
        targetKey: keyContext,
      });
      const root = transposeChordSymbol({
        chordSymbol: chord.root_note,
        semitoneDelta,
        notationPreference,
        targetKey: keyContext,
      });
      const slash = chord.slash_bass
        ? transposeChordSymbol({
            chordSymbol: chord.slash_bass,
            semitoneDelta,
            notationPreference,
            targetKey: keyContext,
          })
        : null;
      return {
        ...chord,
        normalized_chord_symbol: symbol,
        root_note: root,
        slash_bass: slash,
      };
    });
  }, [baseUniqueChords, keyContext, notationPreference, semitoneDelta]);

  useEffect(() => {
    if (occurrences.length === 0) {
      setSelectedChordSymbol(null);
      return;
    }
    const exists = selectedChordSymbol
      ? occurrences.some(
          (occurrence) =>
            occurrence.normalized_chord_symbol === selectedChordSymbol,
        )
      : false;
    if (!exists) {
      setSelectedChordSymbol(occurrences[0].normalized_chord_symbol);
    }
  }, [occurrences, selectedChordSymbol]);

  const selectedInfo = useMemo(() => {
    if (!selectedChordSymbol) return null;
    return uniqueChords.find(
      (chord) => chord.normalized_chord_symbol === selectedChordSymbol,
    );
  }, [selectedChordSymbol, uniqueChords]);

  useEffect(() => {
    if (!selectedChordSymbol) {
      setVoicingOptions([]);
      setSelectedVoicingOptionId(null);
      setSelectedInversionIndex(0);
      return;
    }
    const chordSymbol = selectedChordSymbol;

    let cancelled = false;

    async function loadVoicings() {
      setSaveStatus("saving");
      try {
        const query = new URLSearchParams({
          chord: chordSymbol,
          keyContext,
          handMode: "RH",
        });

        const voicingResponse = await fetchApiData<{
          options: ChordVoicingOptionRow[];
          defaultVoicingOptionId: string | null;
        }>(`/api/songs/${song.id}/voicings?${query.toString()}`);

        const selectionResponse = await fetchApiData<{
          selection: UserVoicingSelectionRow;
          defaultVoicingOptionId: string | null;
        }>(`/api/songs/${song.id}/voicings/selection?${query.toString()}`);

        if (cancelled) return;
        setVoicingOptions(voicingResponse.options);
        setSelectedVoicingOptionId(
          selectionResponse.selection.selected_voicing_option_id ??
            voicingResponse.defaultVoicingOptionId,
        );
        setSaveStatus("saved");
      } catch {
        if (cancelled) return;
        setSaveStatus("error");
      }
    }

    loadVoicings();
    return () => {
      cancelled = true;
    };
  }, [selectedChordSymbol, song.id, keyContext]);

  useEffect(() => {
    const selected = voicingOptions.find(
      (option) => option.id === selectedVoicingOptionId,
    );
    setSelectedInversionIndex(selected?.inversion_index ?? 0);
  }, [selectedVoicingOptionId, voicingOptions]);

  const selectedVoicing = useMemo(() => {
    if (voicingOptions.length === 0) return null;
    if (!selectedVoicingOptionId) return voicingOptions[0];
    return voicingOptions.find((option) => option.id === selectedVoicingOptionId) ?? voicingOptions[0];
  }, [selectedVoicingOptionId, voicingOptions]);

  const selectedSlashBassMidi = useMemo(() => {
    if (!selectedInfo?.slash_bass) return null;
    try {
      return noteToMidi(selectedInfo.slash_bass, 3);
    } catch {
      return null;
    }
  }, [selectedInfo?.slash_bass]);

  const selectedFingering = useMemo(() => {
    if (!selectedVoicing?.fingering_suggested) return [];
    const rightHand = (
      selectedVoicing.fingering_suggested as { rightHand?: unknown }
    ).rightHand;
    return Array.isArray(rightHand)
      ? rightHand.filter((value): value is number => typeof value === "number")
      : [];
  }, [selectedVoicing]);

  async function persistUserSelection(selectedOptionId: string) {
    if (!selectedChordSymbol) return;

    setSaveStatus("saving");
    try {
      const response = await fetch(`/api/songs/${song.id}/voicings/selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chord: selectedChordSymbol,
          keyContext,
          handMode: "RH",
          selectedVoicingOptionId: selectedOptionId,
        }),
      });
      const payload = (await response.json()) as {
        data?: UserVoicingSelectionRow;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de sauvegarder le voicing");
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleTranspose(
    toKey: string,
    nextNotationPreference: NotationPreference,
  ) {
    setSaveStatus("saving");
    try {
      const response = await fetch(`/api/songs/${song.id}/transpose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toKey,
          notationPreference: nextNotationPreference,
        }),
      });
      const payload = (await response.json()) as {
        data?: { song: SongRow };
        error?: string;
      };
      if (!response.ok || !payload.data?.song) {
        throw new Error(payload.error ?? "Impossible de transposer le morceau");
      }
      setCurrentKey(payload.data.song.current_key);
      setNotationPreference(payload.data.song.notation_preference);
      setSaveStatus("saved");
      showTransposeNotice(
        "success",
        `Transposition appliquee en ${payload.data.song.current_key ?? toKey}.`,
      );
    } catch (error) {
      setSaveStatus("error");
      showTransposeNotice(
        "error",
        error instanceof Error
          ? error.message
          : "La transposition a echoue. Reessaie dans quelques secondes.",
      );
    }
  }

  function handleSelectInversion(inversionIndex: number) {
    const selectedOption = voicingOptions.find(
      (option) => option.inversion_index === inversionIndex,
    );
    if (!selectedOption) return;
    setSelectedInversionIndex(inversionIndex);
    setSelectedVoicingOptionId(selectedOption.id);
    void persistUserSelection(selectedOption.id);
  }

  const tabs = [
    { id: "accords" as const, label: "Accords" },
    { id: "configurer" as const, label: "Configurer un plan" },
    { id: "overview" as const, label: "Vue d'ensemble" },
  ];

  return (
    <div
      className={`${optionBDisplayFont.variable} ${optionBBodyFont.variable} ${optionBClassNames.body} song-shell space-y-6 bg-[var(--song-bg)] text-[var(--song-text)]`}
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--song-border)] bg-[var(--song-surface-muted)] px-5 py-5 shadow-[var(--song-shadow)] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={`${optionBClassNames.display} text-5xl leading-[0.95] font-bold text-[var(--song-text)] sm:text-6xl`}
          >
            {song.title}
          </h1>
          <p className={`${optionBClassNames.body} text-lg text-[var(--song-text-muted)]`}>
            {song.artist ?? "Artiste inconnu"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`${optionBClassNames.body} rounded-full border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text-muted)]`}
            >
              Tonalite actuelle: {currentKey ?? "Non definie"}
            </Badge>
            <Badge
              variant="outline"
              className={`${optionBClassNames.body} rounded-full border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text-muted)]`}
            >
              Notation : {notationPreference}
            </Badge>
          </div>
        </div>
        {activeTab === "accords" ? <SaveStatus status={saveStatus} /> : null}
      </div>

      {transposeNotice ? (
        <div
          className={`animate-in fade-in slide-in-from-top-1 rounded-xl border px-4 py-2 text-sm shadow-[var(--song-shadow)] ${
            transposeNotice.kind === "success"
              ? "border-[var(--song-border)] bg-[var(--song-surface)] text-[var(--song-text-muted)]"
              : "border-[var(--song-danger-border)] bg-[var(--song-danger-surface)] text-[var(--song-danger)]"
          }`}
        >
          {transposeNotice.message}
        </div>
      ) : null}

      <div className="grid gap-1 rounded-2xl border border-[var(--song-border)] bg-[var(--song-surface-highlight)] p-1 shadow-[var(--song-shadow)] sm:grid-cols-3">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className={`${optionBClassNames.body} h-11 rounded-sm text-sm font-semibold ${
              activeTab === tab.id
                ? "rounded-xl bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent)]"
                : "rounded-xl text-[var(--song-text-muted)] hover:bg-[var(--song-surface)] hover:text-[var(--song-text)]"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {error && activeTab === "accords" ? (
        <div className="rounded-xl border border-[var(--song-danger-border)] bg-[var(--song-danger-surface)] px-4 py-3 shadow-[var(--song-shadow)]">
          <p className={`${optionBClassNames.body} text-sm font-semibold text-[var(--song-danger)]`}>
            {error}
          </p>
        </div>
      ) : null}

      {activeTab === "accords" ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            {loading ? (
              <>
                <LoadingStateCard label="Chargement du piano..." lines={2} />
                <LoadingStateCard label="Chargement des renversements..." lines={3} />
              </>
            ) : (
              <>
                <PianoKeyboardVisualizer
                  activeNotesMidi={selectedVoicing?.notes_midi ?? []}
                  slashBassMidi={selectedSlashBassMidi}
                  emphasis="normal"
                />
                <InversionSelector
                  options={voicingOptions.map((option) => ({
                    inversionIndex: option.inversion_index,
                    label: option.voicing_label,
                  }))}
                  selectedInversionIndex={selectedInversionIndex}
                  onSelectInversion={handleSelectInversion}
                />
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
            <div className="space-y-6">
              {loading ? (
                <LoadingStateCard label="Chargement des accords..." lines={4} />
              ) : (
                <UniqueChordList
                  chords={uniqueChords}
                  selectedChordSymbol={selectedChordSymbol}
                  onSelectChord={setSelectedChordSymbol}
                />
              )}
              <KeySelector
                currentKey={currentKey}
                originalKey={song.original_key}
                notationPreference={notationPreference}
                onSelectKey={handleTranspose}
                disabled={loading}
              />
            </div>

            <div className="space-y-6">
              {loading ? (
                <LoadingStateCard label="Preparation des voicings..." lines={3} />
              ) : (
                <Card className="rounded-2xl border-[var(--song-border)] bg-[var(--song-surface)] shadow-[var(--song-shadow)]">
                  <CardHeader>
                    <CardTitle
                      className={`${optionBClassNames.display} text-4xl font-bold text-[var(--song-text)]`}
                    >
                      Accord selectionne
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    className={`${optionBClassNames.body} space-y-2 text-sm text-[var(--song-text)]`}
                  >
                    {selectedInfo ? (
                      <>
                        <p>
                          <span className="font-medium">Symbole :</span>{" "}
                          {selectedInfo.normalized_chord_symbol}
                        </p>
                        <p>
                          <span className="font-medium">Occurrences :</span>{" "}
                          {selectedInfo.occurrence_count}
                        </p>
                        <p>
                          <span className="font-medium">Support :</span>{" "}
                          {selectedInfo.is_supported ? "Oui" : "Non"}
                        </p>
                        {selectedInfo.slash_bass ? (
                          <p>
                            <span className="font-medium">Basse imposee :</span>{" "}
                            {selectedInfo.slash_bass}
                          </p>
                        ) : null}
                        {selectedVoicing ? (
                          <FingeringHintBadge fingering={selectedFingering} />
                        ) : null}
                      </>
                    ) : (
                      <p className="text-[var(--song-text-subtle)]">
                        Selectionne un accord dans la liste.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "configurer" ? (
        <PresetConfigurator
          songId={song.id}
          keyContext={keyContext}
          notationPreference={notationPreference}
          uniqueChords={uniqueChords}
        />
      ) : null}

      {activeTab === "overview" ? (
        <PresetOverview
          songId={song.id}
          occurrences={occurrences}
          songTitle={song.title}
          songArtist={song.artist}
          currentKey={currentKey}
          notationPreference={notationPreference}
        />
      ) : null}
    </div>
  );
}

