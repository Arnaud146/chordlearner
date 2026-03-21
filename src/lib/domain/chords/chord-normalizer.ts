import { formatChordSymbol } from "./chord-format";
import { parseChordSymbol } from "./chord-parser";
import type { NotationPreference, ParsedChord } from "./types";

interface NormalizeChordOptions {
  notationPreference?: NotationPreference;
}

export function normalizeChordSymbol(
  input: string,
  options?: NormalizeChordOptions,
): ParsedChord {
  const parsed = parseChordSymbol(input);
  if (!parsed.isSupported) return parsed;

  const notationPreference = options?.notationPreference ?? "auto";

  return {
    ...parsed,
    normalizedChordSymbol: formatChordSymbol({
      rootNote: parsed.rootNote!,
      qualitySymbol: parsed.qualitySymbol ?? "",
      slashBass: parsed.slashBass,
      notationPreference,
    }),
  };
}
