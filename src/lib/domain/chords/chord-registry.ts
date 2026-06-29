import type { QualityCanonical } from "./types";

interface QualityRule {
  canonical: QualityCanonical;
  aliases: RegExp[];
  normalizedSuffix: string;
}

const QUALITY_RULES: QualityRule[] = [
  {
    canonical: "major7",
    aliases: [/^maj7$/i, /^M7$/, /^Δ7$/],
    normalizedSuffix: "maj7",
  },
  {
    canonical: "minor7",
    aliases: [/^m7$/i, /^min7$/i],
    normalizedSuffix: "m7",
  },
  {
    canonical: "minor6",
    aliases: [/^m6$/i, /^min6$/i],
    normalizedSuffix: "m6",
  },
  {
    canonical: "minor",
    aliases: [/^m$/i, /^min$/i],
    normalizedSuffix: "m",
  },
  {
    canonical: "sus2",
    aliases: [/^sus2$/i],
    normalizedSuffix: "sus2",
  },
  {
    canonical: "sus4",
    aliases: [/^sus4$/i],
    normalizedSuffix: "sus4",
  },
  {
    canonical: "add9",
    aliases: [/^add9$/i],
    normalizedSuffix: "add9",
  },
  {
    canonical: "half-diminished",
    aliases: [/^m7b5$/i, /^min7b5$/i, /^ø7?$/],
    normalizedSuffix: "m7b5",
  },
  {
    canonical: "diminished7",
    aliases: [/^dim7$/i],
    normalizedSuffix: "dim7",
  },
  {
    canonical: "diminished",
    aliases: [/^dim$/i],
    normalizedSuffix: "dim",
  },
  {
    canonical: "augmented",
    aliases: [/^aug$/i, /^\+$/],
    normalizedSuffix: "aug",
  },
  {
    canonical: "dominant7",
    aliases: [/^7$/],
    normalizedSuffix: "7",
  },
  {
    canonical: "sixth",
    aliases: [/^6$/],
    normalizedSuffix: "6",
  },
  {
    canonical: "major",
    aliases: [/^$/],
    normalizedSuffix: "",
  },
];

/**
 * Canonical normalized suffixes for every supported quality (e.g. "", "m", "maj7").
 * Used to enumerate the valid chord vocabulary for OCR dictionary correction.
 */
export const NORMALIZED_QUALITY_SUFFIXES: string[] = QUALITY_RULES.map(
  (rule) => rule.normalizedSuffix,
);

export function getQualityFromSuffix(
  rawSuffix: string,
): { canonical: QualityCanonical; normalizedSuffix: string } | null {
  const suffix = rawSuffix.trim();
  for (const rule of QUALITY_RULES) {
    if (rule.aliases.some((alias) => alias.test(suffix))) {
      return {
        canonical: rule.canonical,
        normalizedSuffix: rule.normalizedSuffix,
      };
    }
  }
  return null;
}

export function normalizeAccidentals(value: string): string {
  return value
    .replaceAll("â™¯", "#")
    .replaceAll("â™­", "b")
    .replaceAll("Ã¢â„¢Â¯", "#")
    .replaceAll("Ã¢â„¢Â­", "b")
    .replace(/[♯＃]/g, "#")
    .replace(/[♭]/g, "b");
}

export function normalizeNote(value: string): string | null {
  const normalized = normalizeAccidentals(value).trim();
  const match = normalized.match(/^([A-Ga-g])([#b]?)$/);
  if (!match) return null;
  return `${match[1].toUpperCase()}${match[2]}`;
}

export function toSharp(note: string): string {
  const map: Record<string, string> = {
    Db: "C#",
    Gb: "F#",
  };
  return map[note] ?? note;
}

export function toFlat(note: string): string {
  const map: Record<string, string> = {
    "C#": "Db",
    "D#": "Eb",
    "F#": "Gb",
    "G#": "Ab",
    "A#": "Bb",
  };
  return map[note] ?? note;
}
