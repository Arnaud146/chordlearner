import { classifyLines } from "./classify-lines";
import { isChordToken, normalizeChord } from "./chord-regex";
import type {
  ExtractionMode,
  SongLine,
  SongSection,
  SongSectionType,
  StructuredSong,
  StructuredSongLine,
} from "../../types/chords";

interface NormalizeSongInput {
  sourceUrl: string;
  title: string;
  mode: ExtractionMode;
  rawLines: string[];
}

const SECTION_KEYWORD_TO_TYPE: Record<string, SongSectionType> = {
  intro: "intro",
  verse: "verse",
  chorus: "chorus",
  bridge: "bridge",
  outro: "outro",
  refrain: "refrain",
  "pre-chorus": "pre_chorus",
  "pre chorus": "pre_chorus",
  instrumental: "instrumental",
  solo: "instrumental",
};

function prettifyLabel(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function cleanSectionLabel(raw: string): string {
  return raw.replace(/^\s*\[/, "").replace(/\]\s*$/, "").replace(/\s*:\s*$/, "").trim();
}

function inferSectionFromLine(rawLabel: string): {
  type: SongSectionType;
  label: string;
  index?: number;
} {
  const cleaned = cleanSectionLabel(rawLabel);
  const normalized = cleaned.toLowerCase();
  const match = normalized.match(
    /^(intro|verse|chorus|bridge|outro|refrain|pre[- ]?chorus|instrumental|solo)(?:\s+(\d+))?$/,
  );

  if (!match) {
    return {
      type: "other",
      label: cleaned || "Section",
    };
  }

  const keyword = match[1];
  const index = match[2] ? Number.parseInt(match[2], 10) : undefined;
  const baseLabel = prettifyLabel(keyword.replace(/-/g, " "));
  const label = index ? `${baseLabel} ${index}` : baseLabel;

  return {
    type: SECTION_KEYWORD_TO_TYPE[keyword] ?? "other",
    label,
    index,
  };
}

function buildLyricsWithoutChordTokens(raw: string): string {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  const lyricTokens = tokens.filter((token) => !isChordToken(token));
  return lyricTokens.join(" ").trim();
}

function toStructuredLine(line: SongLine): StructuredSongLine | null {
  if (line.type === "empty" || line.type === "section") {
    return null;
  }

  if (line.type === "chord_line") {
    return {
      kind: "chords_only",
      raw: line.raw,
      chords: line.chords.map((chord) => normalizeChord(chord)),
    };
  }

  if (line.type === "mixed_line") {
    const lyrics = buildLyricsWithoutChordTokens(line.raw);
    const rawChords = line.chords.map((chord) => normalizeChord(chord)).join(" ");

    return {
      kind: "lyrics_with_chords",
      raw: line.raw,
      rawLyrics: lyrics || line.raw,
      rawChords,
      lyrics: lyrics || line.raw,
      chords: line.chords.map((chord) => normalizeChord(chord)),
    };
  }

  return {
    kind: "lyrics_only",
    raw: line.raw,
    lyrics: line.raw.trim(),
    chords: [],
  };
}

function normalizeTitle(rawTitle: string): string {
  const cleaned = rawTitle.trim();
  if (!cleaned) return "Untitled song";

  // Drop common site suffixes from <title>, for example: "Song - Artist - Site".
  const byPipe = cleaned.split("|")[0]?.trim() ?? cleaned;
  const byDash = byPipe.split(" - ")[0]?.trim() ?? byPipe;
  return byDash || cleaned;
}

export function normalizeStructuredSong(input: NormalizeSongInput): StructuredSong {
  const classified = classifyLines(input.rawLines);
  const sections: SongSection[] = [];
  let currentSection: SongSection = {
    type: "other",
    label: "Song",
    lines: [],
  };

  for (const line of classified) {
    if (line.type === "section") {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      const inferred = inferSectionFromLine(line.raw);
      currentSection = {
        type: inferred.type,
        label: inferred.label,
        index: inferred.index,
        lines: [],
      };
      continue;
    }

    const structuredLine = toStructuredLine(line);
    if (!structuredLine) continue;
    currentSection.lines.push(structuredLine);
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    sections.push({
      type: "other",
      label: "Song",
      lines: [],
    });
  }

  const allChords = Array.from(
    new Set(
      sections.flatMap((section) =>
        section.lines.flatMap((line) => line.chords.map((chord) => normalizeChord(chord))),
      ),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return {
    title: normalizeTitle(input.title),
    sourceUrl: input.sourceUrl,
    mode: input.mode,
    sections,
    allChords,
    stats: {
      totalLines: classified.length,
      chordLines: classified.filter((line) => line.type === "chord_line").length,
      lyricLines: classified.filter((line) => line.type === "lyric_line").length,
      mixedLines: classified.filter((line) => line.type === "mixed_line").length,
      sections: sections.length,
    },
  };
}
