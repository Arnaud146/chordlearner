import { normalizeChordSymbol } from "../chords/chord-normalizer";
import { suggestChordCorrection } from "./ocr-correction-suggest";

export interface OCRTokenCandidate {
  text: string;
  confidence: number;
  lineIndex: number;
  wordIndex: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface OCRTokenReviewItem {
  text: string;
  confidence: number;
  lineIndex: number;
  wordIndex: number;
  isChordRecognized: boolean;
  isSuspect: boolean;
  correctionSuggestion: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface OCRPostprocessResult {
  lines: string[];
  tokens: OCRTokenReviewItem[];
}

interface OCRPostprocessOptions {
  chordsOnly?: boolean;
}

interface OCRTokenRow {
  centerY: number;
  tokens: OCRTokenReviewItem[];
}

function sanitizeOCRTokenText(value: string): string {
  return value
    .trim()
    .replace(/^[([{'"`]+/, "")
    .replace(/[)\]}'",;:!?]+$/, "")
    .replace(/[\/\\|]/g, "/")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, "")
    .replace(/\/{2,}/g, "/");
}

function isAdjacentToken(a: OCRTokenCandidate, b: OCRTokenCandidate): boolean {
  return a.lineIndex === b.lineIndex && b.wordIndex === a.wordIndex + 1;
}

function hasValidNumber(value: number | undefined): value is number {
  return Number.isFinite(value);
}

function tryMergeSlashPair(
  first: OCRTokenCandidate,
  second: OCRTokenCandidate,
): OCRTokenCandidate | null {
  if (!isAdjacentToken(first, second)) return null;

  const mergedText = sanitizeOCRTokenText(`${first.text}${second.text}`);
  if (!mergedText.includes("/")) return null;

  const mergedParsed = normalizeChordSymbol(mergedText);
  if (!mergedParsed.isSupported) return null;

  return {
    text: mergedParsed.normalizedChordSymbol,
    confidence: Math.min(first.confidence, second.confidence),
    lineIndex: first.lineIndex,
    wordIndex: first.wordIndex,
    x: first.x,
    y: first.y,
    width: first.width,
    height: first.height,
  };
}

function isStandaloneSlashToken(value: string): boolean {
  const cleaned = sanitizeOCRTokenText(value);
  return /^[/Il1]$/.test(cleaned);
}

function tryMergeSlashTriplet(
  first: OCRTokenCandidate,
  middle: OCRTokenCandidate,
  third: OCRTokenCandidate,
): OCRTokenCandidate | null {
  if (!isAdjacentToken(first, middle) || !isAdjacentToken(middle, third)) {
    return null;
  }
  if (!isStandaloneSlashToken(middle.text)) return null;

  const mergedText = sanitizeOCRTokenText(`${first.text}/${third.text}`);
  const mergedParsed = normalizeChordSymbol(mergedText);
  if (!mergedParsed.isSupported) return null;

  return {
    text: mergedParsed.normalizedChordSymbol,
    confidence: Math.min(first.confidence, middle.confidence, third.confidence),
    lineIndex: first.lineIndex,
    wordIndex: first.wordIndex,
    x: first.x,
    y: first.y,
    width: first.width,
    height: first.height,
  };
}

function mergeSplitSlashChords(candidates: OCRTokenCandidate[]): OCRTokenCandidate[] {
  const sorted = [...candidates].sort((a, b) =>
    a.lineIndex === b.lineIndex
      ? a.wordIndex - b.wordIndex
      : a.lineIndex - b.lineIndex,
  );

  const merged: OCRTokenCandidate[] = [];
  let index = 0;

  while (index < sorted.length) {
    const first = sorted[index];
    const second = sorted[index + 1];
    const third = sorted[index + 2];

    if (first && second && third) {
      const triplet = tryMergeSlashTriplet(first, second, third);
      if (triplet) {
        merged.push(triplet);
        index += 3;
        continue;
      }
    }

    if (first && second) {
      const pair = tryMergeSlashPair(first, second);
      if (pair) {
        merged.push(pair);
        index += 2;
        continue;
      }
    }

    merged.push(first);
    index += 1;
  }

  return merged;
}

function buildLineStringsFromTokens(tokens: OCRTokenReviewItem[]): string[] {
  const lineMap = new Map<number, OCRTokenReviewItem[]>();

  for (const token of tokens) {
    const line = lineMap.get(token.lineIndex) ?? [];
    line.push(token);
    lineMap.set(token.lineIndex, line);
  }

  return Array.from(lineMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, lineTokens]) =>
      lineTokens
        .sort((a, b) => a.wordIndex - b.wordIndex)
        .map((token) => token.text)
        .join(" "),
    );
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function getTokenCenterY(token: OCRTokenReviewItem): number | null {
  if (!hasValidNumber(token.y)) return null;
  const h = hasValidNumber(token.height) ? token.height : 0;
  return token.y + h / 2;
}

function groupTokensByYAxis(tokens: OCRTokenReviewItem[]): OCRTokenRow[] {
  const positioned = tokens.filter((token) => getTokenCenterY(token) !== null);
  if (positioned.length === 0) {
    const fallbackRows = new Map<number, OCRTokenReviewItem[]>();
    for (const token of tokens) {
      const row = fallbackRows.get(token.lineIndex) ?? [];
      row.push(token);
      fallbackRows.set(token.lineIndex, row);
    }
    return Array.from(fallbackRows.entries())
      .sort(([a], [b]) => a - b)
      .map(([, rowTokens]) => ({ centerY: 0, tokens: rowTokens }));
  }

  const heights = positioned
    .map((token) => token.height)
    .filter((h): h is number => hasValidNumber(h) && h > 0);
  const baseHeight = median(heights) || 18;
  const tolerance = Math.max(8, Math.min(26, baseHeight * 0.75));

  const rows: OCRTokenRow[] = [];
  const sorted = [...positioned].sort((a, b) => {
    const ay = getTokenCenterY(a) ?? 0;
    const by = getTokenCenterY(b) ?? 0;
    if (ay !== by) return ay - by;
    const ax = hasValidNumber(a.x) ? a.x : a.wordIndex;
    const bx = hasValidNumber(b.x) ? b.x : b.wordIndex;
    return ax - bx;
  });

  for (const token of sorted) {
    const centerY = getTokenCenterY(token);
    if (centerY === null) continue;

    let bestIndex = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < rows.length; i += 1) {
      const diff = Math.abs(centerY - rows[i].centerY);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0 && bestDiff <= tolerance) {
      const row = rows[bestIndex];
      const n = row.tokens.length;
      row.tokens.push(token);
      row.centerY = (row.centerY * n + centerY) / (n + 1);
    } else {
      rows.push({ centerY, tokens: [token] });
    }
  }

  return rows.sort((a, b) => a.centerY - b.centerY);
}

function sortChordTokensForDisplay(tokens: OCRTokenReviewItem[]): OCRTokenReviewItem[] {
  return [...tokens].sort((a, b) => {
    const ax = hasValidNumber(a.x) ? a.x : Number.POSITIVE_INFINITY;
    const bx = hasValidNumber(b.x) ? b.x : Number.POSITIVE_INFINITY;
    if (ax !== bx) return ax - bx;
    return a.wordIndex - b.wordIndex;
  });
}

function isLikelyLyricRow(rowTokens: OCRTokenReviewItem[], chordCount: number): boolean {
  const lyricWords = rowTokens.filter(
    (token) => !token.isChordRecognized && /[a-z]/.test(token.text),
  ).length;
  return lyricWords >= 3 && chordCount <= 1;
}

function buildChordOnlyLines(
  reviewedTokens: OCRTokenReviewItem[],
): { lines: string[]; tokens: OCRTokenReviewItem[] } {
  const rows = groupTokensByYAxis(reviewedTokens);
  const selectedTokens: OCRTokenReviewItem[] = [];
  const lines: string[] = [];

  for (const row of rows) {
    const chordTokens = row.tokens.filter((token) => token.isChordRecognized);
    if (chordTokens.length === 0) continue;
    if (isLikelyLyricRow(row.tokens, chordTokens.length)) continue;

    const sortedChordTokens = sortChordTokensForDisplay(chordTokens);
    lines.push(sortedChordTokens.map((token) => token.text).join(" "));
    selectedTokens.push(...sortedChordTokens);
  }

  return { lines, tokens: selectedTokens };
}

export function postprocessOCRTokens(
  candidates: OCRTokenCandidate[],
  options?: OCRPostprocessOptions,
): OCRPostprocessResult {
  const mergedCandidates = mergeSplitSlashChords(candidates);

  const reviewedTokens: OCRTokenReviewItem[] = mergedCandidates.map((candidate) => {
    const sanitizedText = sanitizeOCRTokenText(candidate.text);
    const parsed = normalizeChordSymbol(sanitizedText);
    const correctionSuggestion = suggestChordCorrection(sanitizedText);
    const autoCorrected = !parsed.isSupported && Boolean(correctionSuggestion);
    const isChordRecognized = parsed.isSupported || autoCorrected;
    const resolvedText = parsed.isSupported
      ? parsed.normalizedChordSymbol
      : correctionSuggestion ?? sanitizedText;
    const isSuspect = candidate.confidence < 70 || !isChordRecognized || autoCorrected;

    return {
      text: resolvedText || candidate.text,
      confidence: candidate.confidence,
      lineIndex: candidate.lineIndex,
      wordIndex: candidate.wordIndex,
      isChordRecognized,
      isSuspect,
      correctionSuggestion:
        autoCorrected && correctionSuggestion !== resolvedText
          ? correctionSuggestion
          : null,
      x: candidate.x,
      y: candidate.y,
      width: candidate.width,
      height: candidate.height,
    };
  });

  if (options?.chordsOnly) {
    return buildChordOnlyLines(reviewedTokens);
  }

  return {
    lines: buildLineStringsFromTokens(reviewedTokens),
    tokens: reviewedTokens,
  };
}
