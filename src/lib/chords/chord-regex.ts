const ROOT_PATTERN = "(?<root>[A-G](?:#|b)?)";
const BODY_PATTERN =
  "(?<body>(?:maj|min|major|m|dim|aug|\\+|sus2|sus4|sus|add\\d{1,2}|M|Δ|\\d{1,2}|[#b](?:5|9|11|13)|\\([#b0-9,]+\\))*)";
const BASS_PATTERN = "(?<bass>\\/[A-G](?:#|b)?)?";

const CHORD_TOKEN_PATTERN = new RegExp(
  `^${ROOT_PATTERN}${BODY_PATTERN}${BASS_PATTERN}$`,
  "i",
);

function normalizeAccidentals(value: string): string {
  return value
    .replace(/â™¯/g, "#")
    .replace(/â™­/g, "b")
    .replace(/Ã¢â„¢Â¯/g, "#")
    .replace(/Ã¢â„¢Â­/g, "b")
    .replace(/[♯＃]/g, "#")
    .replace(/[♭]/g, "b");
}

function stripEdgePunctuation(value: string): string {
  return value
    .trim()
    .replace(/^[([{'"`]+/, "")
    .replace(/[)\]}'",;:!?]+$/, "");
}

function normalizeBody(body: string): string {
  if (!body) return "";

  return body
    .replace(/major/gi, "maj")
    .replace(/min/gi, "m")
    .replace(/Δ/g, "maj")
    .replace(/M(?=\d)/g, "maj")
    .replace(/M(?![a-zA-Z0-9])/g, "")
    .replace(/\+/g, "aug")
    .replace(/\s+/g, "")
    .replace(/sus(?=[0-9])/gi, "sus")
    .replace(/MAJ/gi, "maj")
    .replace(/DIM/gi, "dim")
    .replace(/AUG/gi, "aug")
    .replace(/ADD/gi, "add");
}

function normalizeRoot(root: string): string {
  const upper = root.toUpperCase();
  if (upper.length <= 1) return upper;
  return `${upper[0]}${upper.slice(1).toLowerCase()}`;
}

function normalizeBass(bass: string | undefined): string {
  if (!bass) return "";
  return `/${normalizeRoot(bass.slice(1))}`;
}

export function normalizeChord(chord: string): string {
  const sanitized = stripEdgePunctuation(
    normalizeAccidentals(chord)
      .replace(/[|\\]/g, "/")
      .replace(/\s*\/\s*/g, "/")
      .replace(/\s+/g, ""),
  );

  const match = sanitized.match(CHORD_TOKEN_PATTERN);
  if (!match?.groups) return sanitized;

  const root = normalizeRoot(match.groups.root ?? "");
  const body = normalizeBody(match.groups.body ?? "");
  const bass = normalizeBass(match.groups.bass);
  return `${root}${body}${bass}`;
}

export function isChordToken(token: string): boolean {
  const sanitized = normalizeChord(token);
  if (!sanitized) return false;
  if (sanitized.length > 20) return false;
  if (!/^[A-G]/.test(sanitized)) return false;

  return CHORD_TOKEN_PATTERN.test(sanitized);
}

export function extractChordTokens(line: string): string[] {
  const rawTokens = line
    .replace(/\t/g, " ")
    .split(/\s+/)
    .map((token) => stripEdgePunctuation(token))
    .filter(Boolean);

  const chords: string[] = [];
  for (const token of rawTokens) {
    if (!isChordToken(token)) continue;
    chords.push(normalizeChord(token));
  }
  return chords;
}
