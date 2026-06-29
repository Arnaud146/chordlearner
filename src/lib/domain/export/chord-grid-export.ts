import type { ChordOccurrenceRow, NotationPreference } from "@/lib/types/db";

export interface ExportMetadataInput {
  songTitle: string;
  songArtist: string | null;
  currentKey: string | null;
  notationPreference: NotationPreference;
}

export interface ExportMetadata {
  title: string;
  artistLabel: string;
  keyLabel: string;
  notationLabel: string;
}

export interface ExportLayout {
  linesPerPage: number;
}

export interface ChordGridExportModel {
  metadata: ExportMetadata;
  lines: string[];
  pages: string[][];
  keyContext: string | null;
  baseFilename: string;
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function groupByLine(occurrences: ChordOccurrenceRow[]): ChordOccurrenceRow[][] {
  const groups = new Map<number, ChordOccurrenceRow[]>();
  const sorted = [...occurrences].sort((a, b) => {
    if (a.line_index !== b.line_index) return a.line_index - b.line_index;
    return a.token_index - b.token_index;
  });

  for (const occurrence of sorted) {
    const line = groups.get(occurrence.line_index) ?? [];
    line.push(occurrence);
    groups.set(occurrence.line_index, line);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, rows]) => rows);
}

export function buildChordLines(occurrences: ChordOccurrenceRow[]): string[] {
  return groupByLine(occurrences)
    .map((line) => line.map((item) => item.normalized_chord_symbol).join(" ").trim())
    .filter((line) => line.length > 0);
}

export function buildExportMeta(input: ExportMetadataInput): ExportMetadata {
  const artist = input.songArtist?.trim() ? input.songArtist.trim() : "Unknown artist";
  return {
    title: input.songTitle.trim(),
    artistLabel: `Artist: ${artist}`,
    keyLabel: `Key: ${input.currentKey ?? "Not set"}`,
    notationLabel: `Notation: ${input.notationPreference}`,
  };
}

export function paginateExportLines(
  lines: string[],
  layout: ExportLayout,
): string[][] {
  const linesPerPage = Math.max(1, Math.floor(layout.linesPerPage));
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  return pages.length > 0 ? pages : [[]];
}

export function buildExportFilename(params: {
  title: string;
  keyContext: string | null;
  format: "pdf" | "png";
  pageIndex?: number;
  totalPages?: number;
}): string {
  const titlePart = sanitizeFilenamePart(params.title) || "grille";
  const keyPart = sanitizeFilenamePart(params.keyContext ?? "");
  const stem = keyPart ? `${titlePart}-${keyPart}` : titlePart;
  const pageSuffix =
    params.totalPages && params.totalPages > 1
      ? `-p${(params.pageIndex ?? 0) + 1}`
      : "";
  return `${stem}${pageSuffix}.${params.format}`;
}

export function buildChordGridExportModel(params: {
  occurrences: ChordOccurrenceRow[];
  songTitle: string;
  songArtist: string | null;
  currentKey: string | null;
  notationPreference: NotationPreference;
  linesPerPage: number;
}): ChordGridExportModel {
  const lines = buildChordLines(params.occurrences);
  const pages = paginateExportLines(lines, { linesPerPage: params.linesPerPage });
  const metadata = buildExportMeta({
    songTitle: params.songTitle,
    songArtist: params.songArtist,
    currentKey: params.currentKey,
    notationPreference: params.notationPreference,
  });

  const titlePart = sanitizeFilenamePart(params.songTitle) || "grille";
  const keyPart = sanitizeFilenamePart(params.currentKey ?? "");
  const baseFilename = keyPart ? `${titlePart}-${keyPart}` : titlePart;

  return {
    metadata,
    lines,
    pages,
    keyContext: params.currentKey,
    baseFilename,
  };
}
