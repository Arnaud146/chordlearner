import { extractChordTokens } from "./chord-regex";

export interface MainContentBlock {
  tag: string;
  attributes: string;
  lines: string[];
  score: number;
  snippet: string;
}

export interface ExtractMainContentResult {
  documentTitle: string | null;
  bestBlock: MainContentBlock | null;
  candidates: MainContentBlock[];
}

const ELEMENTS_TO_REMOVE = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "iframe",
  "form",
  "button",
  "nav",
  "footer",
  "header",
  "aside",
  "figure",
];

const LINE_BREAK_TAG_PATTERN =
  /<\s*br\s*\/?\s*>|<\s*\/\s*(p|div|section|article|main|li|ul|ol|tr|h[1-6])\s*>/gi;
const TAG_PATTERN = /<[^>]+>/g;
const CANDIDATE_BLOCK_PATTERN =
  /<\s*(pre|article|main|section|div)\b([^>]*)>([\s\S]*?)<\s*\/\s*\1\s*>/gi;
const SECTION_HINT_PATTERN =
  /^\s*(\[[^\]]+\]|intro|verse|chorus|bridge|outro|refrain|pre[- ]?chorus|instrumental|solo)(\s+\d+)?\s*:?\s*$/i;
const NOISE_PATTERN =
  /(cookie|consent|sign in|log in|subscribe|advertisement|privacy|terms|share|report ad)/i;

function decodeHtmlEntities(input: string): string {
  const named = input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  const decimalDecoded = named.replace(/&#(\d+);/g, (_match, value: string) => {
    const code = Number.parseInt(value, 10);
    if (!Number.isFinite(code)) return _match;
    return String.fromCodePoint(code);
  });

  return decimalDecoded.replace(/&#x([0-9a-fA-F]+);/g, (_match, value: string) => {
    const code = Number.parseInt(value, 16);
    if (!Number.isFinite(code)) return _match;
    return String.fromCodePoint(code);
  });
}

function removeTagBlocks(html: string, tag: string): string {
  const pattern = new RegExp(`<\\s*${tag}\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*${tag}\\s*>`, "gi");
  return html.replace(pattern, "\n");
}

function stripIrrelevantElements(html: string): string {
  let result = html.replace(/<!--[\s\S]*?-->/g, "\n");

  for (const tag of ELEMENTS_TO_REMOVE) {
    result = removeTagBlocks(result, tag);
  }

  return result;
}

function fragmentToLines(fragment: string, preserveWhitespace: boolean): string[] {
  const withBreaks = fragment.replace(LINE_BREAK_TAG_PATTERN, "\n");
  const withoutTags = withBreaks.replace(TAG_PATTERN, " ");
  const decoded = decodeHtmlEntities(withoutTags)
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ");

  const lines = decoded.split("\n").map((line) => {
    const normalized = preserveWhitespace
      ? line.replace(/\t/g, "  ").replace(/\s+$/g, "")
      : line.replace(/\s+/g, " ").trim();
    return normalized;
  });

  return lines.filter((line) => line.trim().length > 0);
}

function scoreCandidate(block: { tag: string; attributes: string; lines: string[] }): number {
  const nonEmptyLines = block.lines.filter((line) => line.trim().length > 0);
  if (nonEmptyLines.length === 0) return -100;

  const chordTokensCount = nonEmptyLines.reduce(
    (sum, line) => sum + extractChordTokens(line).length,
    0,
  );
  const chordLinesCount = nonEmptyLines.filter((line) => {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    const chords = extractChordTokens(line);
    return chords.length > 0 && chords.length / Math.max(tokens.length, 1) >= 0.5;
  }).length;
  const sectionLinesCount = nonEmptyLines.filter((line) =>
    SECTION_HINT_PATTERN.test(line.trim()),
  ).length;
  const noiseLinesCount = nonEmptyLines.filter((line) => NOISE_PATTERN.test(line)).length;
  const lyricLinesCount = nonEmptyLines.filter(
    (line) => /\b(the|and|you|me|love|when|where|there|dans|avec|pour)\b/i.test(line),
  ).length;

  const tagBonus =
    block.tag === "pre"
      ? 14
      : block.tag === "article"
        ? 9
        : block.tag === "main"
          ? 8
          : block.tag === "section"
            ? 6
            : 2;

  const attr = block.attributes.toLowerCase();
  const attributeBonus = /(chord|lyrics|song|tab|content|article|text)/.test(attr) ? 6 : 0;
  const attributePenalty = /(comment|footer|header|cookie|share|related|ad)/.test(attr)
    ? 8
    : 0;

  let score = 0;
  score += tagBonus;
  score += attributeBonus;
  score -= attributePenalty;
  score += chordLinesCount * 5;
  score += sectionLinesCount * 4;
  score += chordTokensCount * 0.5;
  score += Math.min(lyricLinesCount, 15) * 0.8;
  score += Math.min(nonEmptyLines.length, 120) * 0.12;
  score -= noiseLinesCount * 2;

  if (nonEmptyLines.length < 4) score -= 6;
  if (chordTokensCount < 2) score -= 10;
  if (nonEmptyLines.length > 450) score -= 14;

  return score;
}

function buildSnippet(lines: string[]): string {
  return lines.join(" | ").slice(0, 220);
}

export function extractDocumentTitle(html: string): string | null {
  const titleMatch = html.match(/<\s*title[^>]*>([\s\S]*?)<\s*\/\s*title\s*>/i);
  if (!titleMatch?.[1]) return null;
  const title = decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim());
  return title || null;
}

export function extractMainContent(html: string): ExtractMainContentResult {
  const sanitized = stripIrrelevantElements(html);
  const documentTitle = extractDocumentTitle(sanitized);
  const candidates: MainContentBlock[] = [];

  for (const match of sanitized.matchAll(CANDIDATE_BLOCK_PATTERN)) {
    const tag = match[1].toLowerCase();
    const attributes = (match[2] ?? "").trim();
    const fragment = match[3] ?? "";
    const preserveWhitespace = tag === "pre";
    const lines = fragmentToLines(fragment, preserveWhitespace);
    if (lines.length === 0) continue;

    candidates.push({
      tag,
      attributes,
      lines,
      score: scoreCandidate({ tag, attributes, lines }),
      snippet: buildSnippet(lines.slice(0, 4)),
    });
  }

  if (candidates.length === 0) {
    const fallbackLines = fragmentToLines(sanitized, false);
    candidates.push({
      tag: "body",
      attributes: "",
      lines: fallbackLines,
      score: scoreCandidate({ tag: "body", attributes: "", lines: fallbackLines }),
      snippet: buildSnippet(fallbackLines.slice(0, 4)),
    });
  }

  const sorted = candidates
    .filter((candidate) => candidate.lines.length > 0)
    .sort((left, right) => right.score - left.score);

  const bestBlock = sorted[0] && sorted[0].score > -5 ? sorted[0] : null;

  return {
    documentTitle,
    bestBlock,
    candidates: sorted.slice(0, 8),
  };
}
