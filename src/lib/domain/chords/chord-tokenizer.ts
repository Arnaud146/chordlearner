import { normalizeAccidentals } from "./chord-registry";
import { normalizeChordSymbol } from "./chord-normalizer";
import type { ChordToken } from "./types";

function cleanupToken(raw: string): string {
  return raw
    .replace(/^[([{'"`]+/, "")
    .replace(/[)\]}'",;:!?]+$/, "")
    .trim();
}

function isLikelyChordToken(value: string): boolean {
  if (!value) return false;
  if (!/^[A-Ga-g]/.test(value)) return false;
  if (value.length === 1) return /^[A-G]$/.test(value);

  const secondChar = value[1];
  return /[#bmMadsu67/+]/.test(secondChar);
}

function sanitizePart(raw: string): string {
  return cleanupToken(normalizeAccidentals(raw));
}

function isPotentialChordPrefix(value: string): boolean {
  return Boolean(value) && /^[A-Ga-g][#b]?[a-zA-Z0-9+#/]*$/.test(value);
}

function findBestMergedChord(
  line: string,
  tokens: Array<{ raw: string; index: number }>,
  startIndex: number,
): {
  value: string;
  consumed: number;
  raw: string;
  positionStart: number;
  positionEnd: number;
} | null {
  const maxMergeLength = 5;
  let best: {
    value: string;
    consumed: number;
    raw: string;
    positionStart: number;
    positionEnd: number;
  } | null = null;

  let merged = "";

  for (
    let endIndex = startIndex;
    endIndex < tokens.length && endIndex < startIndex + maxMergeLength;
    endIndex += 1
  ) {
    const part = sanitizePart(tokens[endIndex].raw);
    if (!part) break;

    merged += part;
    if (!isPotentialChordPrefix(merged)) break;

    const parsed = normalizeChordSymbol(merged);
    if (!parsed.isSupported) continue;
    if (merged.length === 1 && !/^[A-G]$/.test(merged)) continue;

    const first = tokens[startIndex];
    const last = tokens[endIndex];
    const raw = line.slice(first.index, last.index + last.raw.length);

    best = {
      value: merged,
      consumed: endIndex - startIndex + 1,
      raw,
      positionStart: first.index,
      positionEnd: last.index + last.raw.length,
    };
  }

  return best;
}

export function tokenizeChordText(text: string): ChordToken[] {
  const lines = text.split(/\r?\n/);
  const tokens: ChordToken[] = [];

  lines.forEach((line, lineIndex) => {
    const rawTokens = Array.from(line.matchAll(/\S+/g)).map((match) => ({
      raw: match[0],
      index: match.index ?? 0,
    }));
    let tokenIndex = 0;
    let cursor = 0;

    while (cursor < rawTokens.length) {
      const merged = findBestMergedChord(line, rawTokens, cursor);
      if (merged) {
        tokens.push({
          raw: merged.raw,
          value: merged.value,
          lineIndex,
          tokenIndex,
          positionStart: merged.positionStart,
          positionEnd: merged.positionEnd,
        });
        tokenIndex += 1;
        cursor += merged.consumed;
        continue;
      }

      const rawToken = rawTokens[cursor];
      const raw = rawToken.raw;
      const value = sanitizePart(raw);
      if (!isLikelyChordToken(value)) {
        cursor += 1;
        continue;
      }
      const start = rawToken.index + (raw.indexOf(value) >= 0 ? raw.indexOf(value) : 0);

      tokens.push({
        raw,
        value,
        lineIndex,
        tokenIndex,
        positionStart: start,
        positionEnd: start + value.length,
      });
      tokenIndex += 1;
      cursor += 1;
    }
  });

  return tokens;
}
