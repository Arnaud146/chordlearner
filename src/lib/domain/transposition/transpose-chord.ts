import type { NotationPreference } from "@/lib/types/db";
import { parseChordSymbol } from "../chords/chord-parser";
import { formatChordSymbol } from "../chords/chord-format";
import { transposeNote } from "./transpose-note";

export function transposeChordSymbol(params: {
  chordSymbol: string;
  semitoneDelta: number;
  notationPreference: NotationPreference;
  targetKey: string;
}): string {
  const parsed = parseChordSymbol(params.chordSymbol);
  if (!parsed.isSupported || !parsed.rootNote) {
    return params.chordSymbol;
  }

  const nextRoot = transposeNote({
    note: parsed.rootNote,
    semitoneDelta: params.semitoneDelta,
    notationPreference: params.notationPreference,
    targetKey: params.targetKey,
  });

  const nextBass = parsed.slashBass
    ? transposeNote({
        note: parsed.slashBass,
        semitoneDelta: params.semitoneDelta,
        notationPreference: params.notationPreference,
        targetKey: params.targetKey,
      })
    : null;

  return formatChordSymbol({
    rootNote: nextRoot,
    qualitySymbol: parsed.qualitySymbol ?? "",
    slashBass: nextBass,
    notationPreference: params.notationPreference,
  });
}
