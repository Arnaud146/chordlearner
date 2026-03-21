import {
  extractChordTokens,
  isChordToken,
  normalizeChord,
} from "./chord-regex";
import type { LineType, SongLine } from "../../types/chords";

const BRACKET_SECTION_PATTERN = /^\s*\[[^\]]+\]\s*$/;
const SECTION_KEYWORD_PATTERN =
  /^\s*(intro|verse|chorus|bridge|outro|refrain|pre[- ]?chorus|instrumental|solo)(\s+\d+)?\s*:?\s*$/i;

function isSectionLine(value: string): boolean {
  const trimmed = value.trim();
  return BRACKET_SECTION_PATTERN.test(trimmed) || SECTION_KEYWORD_PATTERN.test(trimmed);
}

function tokenizeLine(line: string): string[] {
  return line
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function countSentencePunctuation(line: string): number {
  const matches = line.match(/[.,!?;:]/g);
  return matches?.length ?? 0;
}

function lyricTokenCount(tokens: string[]): number {
  return tokens.filter((token) => /[A-Za-z]{2,}/.test(token) && !isChordToken(token))
    .length;
}

function inferLineType(line: string): LineType {
  const trimmed = line.trim();
  if (!trimmed) return "empty";
  if (isSectionLine(trimmed)) return "section";

  const tokens = tokenizeLine(trimmed);
  if (tokens.length === 0) return "empty";

  const chordTokens = extractChordTokens(trimmed);
  const chordRatio = chordTokens.length / tokens.length;
  const punctuation = countSentencePunctuation(trimmed);
  const lyricWords = lyricTokenCount(tokens);

  // Heuristic #1:
  // mostly chord tokens, short tokens, and almost no sentence punctuation.
  if (chordTokens.length >= 2 && chordRatio >= 0.6 && punctuation <= 1 && lyricWords <= 1) {
    return "chord_line";
  }

  // Heuristic #2:
  // line contains both natural language words and at least one chord.
  if (chordTokens.length >= 1 && lyricWords >= 2) {
    return "mixed_line";
  }

  if (chordTokens.length === 0) {
    return "lyric_line";
  }

  // Heuristic #3:
  // low punctuation and low lyric density indicates a chord-focused line.
  if (chordRatio >= 0.5 && punctuation === 0 && lyricWords <= 1) {
    return "chord_line";
  }

  return "lyric_line";
}

function extractLyricsPart(line: string): string | null {
  const tokens = tokenizeLine(line);
  const filtered = tokens.filter((token) => !isChordToken(token));
  const lyrics = filtered.join(" ").trim();
  return lyrics.length > 0 ? lyrics : null;
}

export function classifyLine(raw: string, index: number): SongLine {
  const type = inferLineType(raw);
  const chords =
    type === "section" || type === "empty"
      ? []
      : extractChordTokens(raw).map((chord) => normalizeChord(chord));
  const lyrics = type === "lyric_line" || type === "mixed_line" ? extractLyricsPart(raw) : null;

  return {
    index,
    type,
    raw,
    chords,
    lyrics,
  };
}

export function classifyLines(lines: string[]): SongLine[] {
  return lines.map((line, index) => classifyLine(line, index));
}
