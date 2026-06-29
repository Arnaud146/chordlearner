import { normalizeChordSymbol } from "../chords/chord-normalizer";
import { suggestChordByDictionary } from "./ocr-dictionary-correct";

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
  // "BB" / "EB" / "AB" etc. → uppercase B misread as flat sign
  (value) => value.replace(/^([A-G])B(.*)/,  (_m, root, rest) => `${root}b${rest}`),
  // "8b" → "Bb" (OCR confuses 8 with B)
  (value) => value.replace(/^8/, "B"),
  // OCR misreads of "#": H, fl, fi, ft, ff, tl, ti, tt, if, it, ll
  (value) => value.replace(/^([A-Ga-g])(?:H|fl|fi|ft|ff|tl|ti|tt|ll)/, "$1#"),
  // "#" misread in slash bass: B/Ffi → B/F#
  (value) => value.replace(/(\/[A-Ga-g])(?:H|fl|fi|ft|ff|tl|ti|tt|ll)/, "$1#"),
  // Insert "#" after root note for unrecognized chords
  (value) => value.replace(/^([A-Ga-g])([^#b])/, "$1#$2"),
  // Insert "#" after slash bass note
  (value) => value.replace(/\/([A-Ga-g])$/, "/$1#"),
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
    // A transform that collapses a longer token into just a bare root+accidental
    // (e.g. "aff" → "a#" via the ff→# misread transform) is more likely a lyric
    // fragment than a mangled chord — skip it.
    if (candidate.length < seed.length && /^[A-Ga-g][#b]?$/i.test(candidate)) continue;
    const normalizedCandidate = normalizeChordSymbol(candidate);
    if (normalizedCandidate.isSupported) {
      return normalizedCandidate.normalizedChordSymbol;
    }
  }

  // Fallback: nearest valid chord by OCR-confusion-weighted edit distance.
  return suggestChordByDictionary(seed);
}
