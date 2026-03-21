import { extractMainContent } from "./extract-main-content";
import { normalizeChord } from "./chord-regex";
import { normalizeStructuredSong } from "./normalize-song";
import type { ChordExtractionDebug, StructuredSong } from "../../types/chords";

export interface ParseSongFromHtmlInput {
  sourceUrl: string;
  html: string;
}

export interface ParseSongFromHtmlResult {
  song: StructuredSong;
  debug: ChordExtractionDebug;
}

interface ExtractorResult {
  extractorName: string;
  title: string;
  rawLines: string[];
  candidateBlocks: string[];
}

interface HtmlExtractor {
  name: string;
  supports(url: URL): boolean;
  extract(input: ParseSongFromHtmlInput): ExtractorResult;
}

const TRANSPOSE_LABEL_PATTERN =
  /^(tonalit(?:e|\u00e9)|tonality|key|transpose|transposition)\s*:/i;
const TRANSPOSE_LABEL_ONLY_PATTERN =
  /^(tonalit(?:e|\u00e9)|tonality|key|transpose|transposition)\s*$/i;
const SIMPLE_KEY_TOKEN_PATTERN = /^[A-G](?:#|b)?$/;

function decodeHtmlEntities(input: string): string {
  const named = input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  const decimalDecoded = named.replace(/&#(\d+);/g, (match, value: string) => {
    const code = Number.parseInt(value, 10);
    if (!Number.isFinite(code)) return match;
    return String.fromCodePoint(code);
  });

  return decimalDecoded.replace(/&#x([0-9a-fA-F]+);/g, (match, value: string) => {
    const code = Number.parseInt(value, 16);
    if (!Number.isFinite(code)) return match;
    return String.fromCodePoint(code);
  });
}

function stripTags(fragment: string): string {
  return fragment.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function tokenizeCompact(line: string): string[] {
  return line
    .replace(/[|·•]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^[^A-Za-z#b]+|[^A-Za-z0-9#b/]+$/g, ""))
    .filter(Boolean);
}

function isSimpleKeyToken(token: string): boolean {
  return SIMPLE_KEY_TOKEN_PATTERN.test(token);
}

function isLikelyInlineKeySelector(line: string): boolean {
  const tokens = tokenizeCompact(line);
  if (tokens.length < 8) return false;
  return tokens.every((token) => isSimpleKeyToken(token));
}

export function stripTranspositionControls(lines: string[]): string[] {
  const cleaned: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      index += 1;
      continue;
    }

    if (TRANSPOSE_LABEL_PATTERN.test(trimmed) || TRANSPOSE_LABEL_ONLY_PATTERN.test(trimmed)) {
      index += 1;

      const candidateIndices: number[] = [];
      const distinctKeys = new Set<string>();
      let lookahead = index;

      while (lookahead < lines.length) {
        const candidate = lines[lookahead]?.trim() ?? "";
        if (!candidate) break;

        const tokens = tokenizeCompact(candidate);
        const keyOnly = tokens.length > 0 && tokens.every((token) => isSimpleKeyToken(token));
        if (!keyOnly) break;

        candidateIndices.push(lookahead);
        for (const token of tokens) distinctKeys.add(token);
        lookahead += 1;
      }

      const totalKeyTokens = candidateIndices.reduce((sum, lineIndex) => {
        return sum + tokenizeCompact(lines[lineIndex]).length;
      }, 0);
      const shouldDropCandidates =
        candidateIndices.length > 0 &&
        (distinctKeys.size >= 6 || totalKeyTokens >= 10 || isLikelyInlineKeySelector(trimmed));

      if (shouldDropCandidates) {
        index = lookahead;
        continue;
      }

      continue;
    }

    if (isLikelyInlineKeySelector(trimmed)) {
      index += 1;
      continue;
    }

    cleaned.push(line);
    index += 1;
  }

  return cleaned;
}

function fallbackTitleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").filter(Boolean).pop();
    if (!lastSegment) return "Untitled song";
    return decodeURIComponent(lastSegment)
      .replace(/[-_]+/g, " ")
      .replace(/\.[a-z0-9]+$/i, "")
      .trim();
  } catch {
    return "Untitled song";
  }
}

function extractTitleFromBoiteAChansons(html: string): string | null {
  const match = html.match(
    /<div\s+id="dTitreChanson"[^>]*>([\s\S]*?)<\/div>/i,
  );
  if (!match?.[1]) return null;
  return normalizeWhitespace(decodeHtmlEntities(stripTags(match[1])));
}

function extractDataAChords(fragment: string): string[] {
  const chords: string[] = [];
  for (const match of fragment.matchAll(/data-a="([^"]+)"/g)) {
    const raw = decodeHtmlEntities(match[1]).trim();
    if (!raw) continue;
    chords.push(normalizeChord(raw));
  }
  return chords;
}

function extractLyricsFromPL(fragment: string): string {
  const withoutChordSpans = fragment
    .replace(/<span[^>]*class="sI"[^>]*>[\s\S]*?<\/span>/gi, " ")
    .replace(/<span[^>]*class="ALI"[^>]*>[\s\S]*?<\/span>/gi, " ");

  const text = normalizeWhitespace(decodeHtmlEntities(stripTags(withoutChordSpans)));
  return text.replace(/\s+\/\s+/g, " ").trim();
}

function sanitizeSectionLabel(text: string): string {
  return normalizeWhitespace(text)
    .replace(/^\((.*)\)$/g, "$1")
    .trim();
}

export function extractBoiteAChansonsRawLines(html: string): string[] {
  const partitionStart = html.indexOf('id="divPartition"');
  if (partitionStart < 0) {
    throw new Error("Bloc divPartition introuvable.");
  }

  const segmentAfterStart = html.slice(partitionStart);
  const scriptIndex = segmentAfterStart.indexOf("<script");
  const partitionSegment =
    scriptIndex >= 0 ? segmentAfterStart.slice(0, scriptIndex) : segmentAfterStart;

  const lineBlocks = Array.from(
    partitionSegment.matchAll(
      /<div\s+class="(pL|pLI|pLS|pLVV)"[^>]*>([\s\S]*?)<\/div>/gi,
    ),
  );

  if (lineBlocks.length === 0) {
    throw new Error("Aucune ligne de partition pL/pLI detectee.");
  }

  const lines: string[] = [];
  for (const block of lineBlocks) {
    const className = (block[1] ?? "").toLowerCase();
    const inner = block[2] ?? "";

    if (className === "plvv") {
      if (lines.length > 0 && lines[lines.length - 1] !== "") {
        lines.push("");
      }
      continue;
    }

    if (className === "pls") {
      const label = sanitizeSectionLabel(extractLyricsFromPL(inner));
      if (label) lines.push(`[${label}]`);
      continue;
    }

    const chords = extractDataAChords(inner);
    const lyricText = extractLyricsFromPL(inner);

    if (chords.length > 0) {
      lines.push(chords.join(" "));
    }

    if (className === "pl" && lyricText) {
      lines.push(lyricText);
    }
  }

  return lines
    .map((line) => line.trimEnd())
    .filter((line, index, all) => {
      if (line.length > 0) return true;
      return index > 0 && index < all.length - 1;
    });
}

const boiteAChansonsExtractor: HtmlExtractor = {
  name: "boiteachansons-extractor",
  supports(url) {
    return /(^|\.)boiteachansons\.net$/i.test(url.hostname);
  },
  extract(input) {
    const title = extractTitleFromBoiteAChansons(input.html) ?? fallbackTitleFromUrl(input.sourceUrl);
    const rawLines = extractBoiteAChansonsRawLines(input.html);

    return {
      extractorName: "boiteachansons-extractor",
      title,
      rawLines,
      candidateBlocks: [
        "dom:#divPartition",
        "line-classes:pL,pLI,pLS,pLVV",
        `raw-lines:${rawLines.length}`,
      ],
    };
  },
};

const genericExtractor: HtmlExtractor = {
  name: "generic-html-extractor",
  supports: () => true,
  extract(input) {
    const extracted = extractMainContent(input.html);
    const best = extracted.bestBlock;

    if (!best) {
      throw new Error("Bloc principal introuvable pour la chanson.");
    }

    const cleanedLines = best.lines
      .map((line) => line.replace(/\s+$/g, ""))
      .filter((line) => line.trim().length > 0);
    const filteredLines = stripTranspositionControls(cleanedLines);

    if (filteredLines.length === 0) {
      throw new Error("Aucune ligne exploitable detectee dans la page.");
    }

    return {
      extractorName: "generic-html-extractor",
      title: extracted.documentTitle ?? fallbackTitleFromUrl(input.sourceUrl),
      rawLines: filteredLines,
      candidateBlocks: extracted.candidates.map(
        (candidate) => `${candidate.tag}(${candidate.score.toFixed(1)}): ${candidate.snippet}`,
      ),
    };
  },
};

const registeredExtractors: HtmlExtractor[] = [
  boiteAChansonsExtractor,
  genericExtractor,
];

function pickExtractor(url: URL): HtmlExtractor {
  return (
    registeredExtractors.find((extractor) => extractor.supports(url)) ?? genericExtractor
  );
}

export function parseSongFromHtml(input: ParseSongFromHtmlInput): ParseSongFromHtmlResult {
  const parsedUrl = new URL(input.sourceUrl);
  const extractor = pickExtractor(parsedUrl);
  const extracted = extractor.extract(input);

  const song = normalizeStructuredSong({
    sourceUrl: input.sourceUrl,
    title: extracted.title,
    mode: "web",
    rawLines: extracted.rawLines,
  });

  if (song.allChords.length < 2) {
    throw new Error("Aucun bloc accords/paroles fiable n'a ete detecte.");
  }

  return {
    song,
    debug: {
      sourceKind: "html",
      selectedExtractor: extracted.extractorName,
      candidateBlocks: extracted.candidateBlocks,
      rawLines: extracted.rawLines,
    },
  };
}
