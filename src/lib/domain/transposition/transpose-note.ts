import { resolveEffectiveNotationPreference } from "./key-signature-preference";
import type { NotationPreference } from "@/lib/types/db";

const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function getSemitoneDelta(fromKey: string, toKey: string): number {
  const from = NOTE_TO_PITCH_CLASS[fromKey];
  const to = NOTE_TO_PITCH_CLASS[toKey];
  if (from === undefined || to === undefined) {
    throw new Error(`Invalid key for transposition: ${fromKey} -> ${toKey}`);
  }
  return ((to - from) % 12 + 12) % 12;
}

export function transposeNote(params: {
  note: string;
  semitoneDelta: number;
  notationPreference: NotationPreference;
  targetKey: string;
}): string {
  const base = NOTE_TO_PITCH_CLASS[params.note];
  if (base === undefined) {
    throw new Error(`Invalid note: ${params.note}`);
  }
  const nextPitchClass = ((base + params.semitoneDelta) % 12 + 12) % 12;
  const effective = resolveEffectiveNotationPreference({
    notationPreference: params.notationPreference,
    targetKey: params.targetKey,
  });
  return effective === "flats"
    ? FLAT_NAMES[nextPitchClass]
    : SHARP_NAMES[nextPitchClass];
}
