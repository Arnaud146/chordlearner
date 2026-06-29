import { NORMALIZED_QUALITY_SUFFIXES } from "../chords/chord-registry";
import { normalizeChordSymbol } from "../chords/chord-normalizer";

/**
 * Dictionary-based OCR correction.
 *
 * Instead of a fixed list of regex transforms, this enumerates the finite set of
 * valid chord symbols and picks the closest one to a suspect token using an
 * edit distance weighted by known OCR character confusions (8↔B, 6↔G, 1↔I↔l↔/,
 * H↔#, letter case, ...). This generalizes to tokens with multiple errors that
 * single-shot regex transforms miss.
 */

// Common enharmonic root spellings. Exotic ones (E#, Cb, ...) are omitted on
// purpose to keep matches high-precision.
const ROOT_SPELLINGS = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F",
  "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
];

// Symmetric OCR confusion groups: a substitution within a group costs less.
const CONFUSION_GROUPS = [
  ["8", "B"],
  ["6", "G"],
  ["5", "S"],
  ["0", "O"],
  ["2", "Z"],
  ["1", "I", "l", "|", "/", "i"],
  ["#", "H"],
];

const SUB_COST_EXACT = 0;
const SUB_COST_CASE = 0.4;
const SUB_COST_CONFUSION = 0.5;
const SUB_COST_OTHER = 1;
const INDEL_COST = 1;
const MAX_DISTANCE = 1;

let chordVocabularyCache: string[] | null = null;

function buildChordVocabulary(): string[] {
  const vocab: string[] = [];
  for (const root of ROOT_SPELLINGS) {
    for (const suffix of NORMALIZED_QUALITY_SUFFIXES) {
      vocab.push(root + suffix);
    }
  }
  return vocab;
}

function getChordVocabulary(): string[] {
  if (!chordVocabularyCache) chordVocabularyCache = buildChordVocabulary();
  return chordVocabularyCache;
}

function inSameConfusionGroup(a: string, b: string): boolean {
  return CONFUSION_GROUPS.some((group) => group.includes(a) && group.includes(b));
}

function substitutionCost(a: string, b: string): number {
  if (a === b) return SUB_COST_EXACT;
  if (a.toLowerCase() === b.toLowerCase()) return SUB_COST_CASE;
  if (inSameConfusionGroup(a, b)) return SUB_COST_CONFUSION;
  return SUB_COST_OTHER;
}

function weightedEditDistance(source: string, target: string): number {
  const rows = source.length + 1;
  const cols = target.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 1; i < rows; i += 1) dp[i][0] = i * INDEL_COST;
  for (let j = 1; j < cols; j += 1) dp[0][j] = j * INDEL_COST;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const sub = dp[i - 1][j - 1] + substitutionCost(source[i - 1], target[j - 1]);
      const del = dp[i - 1][j] + INDEL_COST;
      const ins = dp[i][j - 1] + INDEL_COST;
      dp[i][j] = Math.min(sub, del, ins);
    }
  }

  return dp[source.length][target.length];
}

function closestInVocabulary(token: string, vocabulary: string[]): string | null {
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of vocabulary) {
    // Roots must plausibly match: skip candidates whose first char is unrelated.
    if (substitutionCost(token[0], candidate[0]) > SUB_COST_CONFUSION) continue;
    const distance = weightedEditDistance(token, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return best && bestDistance <= MAX_DISTANCE ? best : null;
}

function isCorrectableToken(token: string): boolean {
  if (!token) return false;
  if (token.length > 8) return false;
  // Reject lyric words: 3+ pure letters that don't even start on a note letter.
  // (A corrupted root may be a digit, e.g. "8H" -> "B#", so we don't require a
  // surviving note letter; the first-char prefilter + distance threshold guard
  // the rest.) Letter-only qualities like "Cdim"/"Caug" start on a note, so kept.
  if (/^[A-Za-z]{3,}$/.test(token) && !/^[A-Ga-g]/.test(token)) return false;
  return true;
}

/**
 * Returns the closest valid chord symbol to `rawToken`, or null when nothing is
 * within the confusion-weighted distance threshold. Slash chords are corrected
 * on each side independently.
 */
export function suggestChordByDictionary(rawToken: string): string | null {
  const token = rawToken.trim();
  if (!isCorrectableToken(token)) return null;

  const vocabulary = getChordVocabulary();

  if (token.includes("/")) {
    const slashIndex = token.indexOf("/");
    const chordPart = token.slice(0, slashIndex);
    const bassPart = token.slice(slashIndex + 1);
    if (!chordPart || !bassPart) return null;

    const fixedChord = closestInVocabulary(chordPart, vocabulary);
    const fixedBass = closestInVocabulary(bassPart, ROOT_SPELLINGS);
    if (!fixedChord || !fixedBass) return null;

    const normalized = normalizeChordSymbol(`${fixedChord}/${fixedBass}`);
    return normalized.isSupported ? normalized.normalizedChordSymbol : null;
  }

  const fixed = closestInVocabulary(token, vocabulary);
  if (!fixed) return null;

  const normalized = normalizeChordSymbol(fixed);
  return normalized.isSupported ? normalized.normalizedChordSymbol : null;
}
