import { toFlat, toSharp } from "./chord-registry";
import type { NotationPreference } from "./types";

function formatNote(note: string, notationPreference: NotationPreference): string {
  if (notationPreference === "sharps") return toSharp(note);
  if (notationPreference === "flats") return toFlat(note);
  return note;
}

interface FormatChordSymbolInput {
  rootNote: string;
  qualitySymbol: string;
  slashBass?: string | null;
  notationPreference?: NotationPreference;
}

export function formatChordSymbol(input: FormatChordSymbolInput): string {
  const pref = input.notationPreference ?? "auto";
  const root = formatNote(input.rootNote, pref);
  const bass = input.slashBass ? formatNote(input.slashBass, pref) : null;

  return `${root}${input.qualitySymbol}${bass ? `/${bass}` : ""}`;
}
