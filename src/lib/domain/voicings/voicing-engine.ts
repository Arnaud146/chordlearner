import { parseChordSymbol } from "../chords/chord-parser";
import { suggestRightHandFingering } from "./fingering-engine";
import { computeDifficultyScore } from "./voicing-heuristics";
import { midiToScientific, noteToMidi } from "./piano-layout";

export type HandMode = "RH" | "BH";

export interface VoicingOption {
  handMode: HandMode;
  inversionIndex: number;
  voicingLabel: string;
  notesMidi: number[];
  notesScientific: string[];
  difficultyScore: number;
  slashBass: string | null;
  slashBassMidi: number | null;
  fingeringSuggested: {
    rightHand: number[];
  };
}

const INTERVALS_BY_QUALITY: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  add9: [0, 4, 7, 14],
  sixth: [0, 4, 7, 9],
  minor6: [0, 3, 7, 9],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
};

function normalizeAscending(baseMidiNotes: number[]): number[] {
  const sorted = [...baseMidiNotes].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i += 1) {
    while (sorted[i] <= sorted[i - 1]) {
      sorted[i] += 12;
    }
  }
  return sorted;
}

function invertNotes(baseMidiNotes: number[], inversionIndex: number): number[] {
  let notes = normalizeAscending(baseMidiNotes);
  for (let i = 0; i < inversionIndex; i += 1) {
    const [first, ...rest] = notes;
    notes = [...rest, first + 12];
    notes = normalizeAscending(notes);
  }
  return notes;
}

function buildVoicingLabel(inversionIndex: number): string {
  if (inversionIndex === 0) return "Position fondamentale";
  if (inversionIndex === 1) return "1er renversement";
  if (inversionIndex === 2) return "2e renversement";
  return `${inversionIndex}e renversement`;
}

export function generateRightHandVoicings(chordSymbol: string): VoicingOption[] {
  const parsed = parseChordSymbol(chordSymbol);
  if (!parsed.isSupported || !parsed.rootNote || !parsed.qualityCanonical) {
    return [];
  }

  const intervals = INTERVALS_BY_QUALITY[parsed.qualityCanonical] ?? [0, 4, 7];
  const rootMidi = noteToMidi(parsed.rootNote, 4);
  const baseMidi = intervals.map((interval) => rootMidi + interval);
  const maxVoicings = intervals.length >= 4 ? 3 : 3;

  const options: VoicingOption[] = [];
  for (let inversionIndex = 0; inversionIndex < maxVoicings; inversionIndex += 1) {
    const notesMidi = invertNotes(baseMidi, inversionIndex);
    const fingering = suggestRightHandFingering(notesMidi);
    options.push({
      handMode: "RH",
      inversionIndex,
      voicingLabel: buildVoicingLabel(inversionIndex),
      notesMidi,
      notesScientific: notesMidi.map((midi) => midiToScientific(midi)),
      difficultyScore: computeDifficultyScore(notesMidi),
      slashBass: parsed.slashBass,
      slashBassMidi: parsed.slashBass ? noteToMidi(parsed.slashBass, 3) : null,
      fingeringSuggested: fingering,
    });
  }

  return options;
}
