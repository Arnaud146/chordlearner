import { normalizeChordSymbol } from "../chords/chord-normalizer";

function sanitizeOCRToken(rawToken: string): string {
  return rawToken
    .trim()
    .replace(/^[([{'"`]+/, "")
    .replace(/[)\]}'",;:!?]+$/, "")
    .replace(/[／⁄∕]/g, "/")
    .replace(/\s*[/\\|]\s*/g, "/")
    .replace(/\s+/g, "")
    .replace(/\/{2,}/g, "/");
}

const COMMON_OCR_TRANSFORMS: Array<(value: string) => string> = [
  (value) => value,
  (value) => value.replace(/[|\\]/g, "/"),
  (value) =>
    value.replace(
      /([A-Ga-g][#b]?(?:maj7|m7|m6|m|sus2|sus4|add9|dim|aug|\+|7|6)?)\s*[Il1]\s*([A-Ga-g][#b]?)/g,
      "$1/$2",
    ),
  (value) =>
    value.replace(
      /([A-Ga-g][#b]?(?:maj7|m7|m6|m|sus2|sus4|add9|dim|aug|\+|7|6)?)\s*-\s*([A-Ga-g][#b]?)/g,
      "$1/$2",
    ),
];

export function suggestChordCorrection(rawToken: string): string | null {
  const seed = sanitizeOCRToken(rawToken);
  const candidateSet = new Set<string>();

  for (const source of [rawToken, seed]) {
    if (!source) continue;
    for (const transform of COMMON_OCR_TRANSFORMS) {
      const transformed = sanitizeOCRToken(transform(source));
      if (transformed) candidateSet.add(transformed);
    }
  }

  for (const candidate of candidateSet) {
    const normalizedCandidate = normalizeChordSymbol(candidate);
    if (normalizedCandidate.isSupported) {
      return normalizedCandidate.normalizedChordSymbol;
    }
  }

  return null;
}
