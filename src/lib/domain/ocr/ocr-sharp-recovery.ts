import { parseChordSymbol } from "../chords/chord-parser";
import { formatChordSymbol } from "../chords/chord-format";
import { normalizeChordSymbol } from "../chords/chord-normalizer";

const DIATONIC: Record<string, string[]> = {
  C: ["C", "Dm", "Em", "F", "G", "Am"],
  Db: ["Db", "Ebm", "Fm", "Gb", "Ab", "Bbm"],
  D: ["D", "Em", "F#m", "G", "A", "Bm"],
  Eb: ["Eb", "Fm", "Gm", "Ab", "Bb", "Cm"],
  E: ["E", "F#m", "G#m", "A", "B", "C#m"],
  F: ["F", "Gm", "Am", "Bb", "C", "Dm"],
  "F#": ["F#", "G#m", "A#m", "B", "C#", "D#m"],
  G: ["G", "Am", "Bm", "C", "D", "Em"],
  Ab: ["Ab", "Bbm", "Cm", "Db", "Eb", "Fm"],
  A: ["A", "Bm", "C#m", "D", "E", "F#m"],
  Bb: ["Bb", "Cm", "Dm", "Eb", "F", "Gm"],
  B: ["B", "C#m", "D#m", "E", "F#", "G#m"],
};

const SCALE_NOTES: Record<string, Set<string>> = {
  C: new Set(["C", "D", "E", "F", "G", "A", "B"]),
  Db: new Set(["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"]),
  D: new Set(["D", "E", "F#", "G", "A", "B", "C#"]),
  Eb: new Set(["Eb", "F", "G", "Ab", "Bb", "C", "D"]),
  E: new Set(["E", "F#", "G#", "A", "B", "C#", "D#"]),
  F: new Set(["F", "G", "A", "Bb", "C", "D", "E"]),
  "F#": new Set(["F#", "G#", "A#", "B", "C#", "D#", "E#"]),
  G: new Set(["G", "A", "B", "C", "D", "E", "F#"]),
  Ab: new Set(["Ab", "Bb", "C", "Db", "Eb", "F", "G"]),
  A: new Set(["A", "B", "C#", "D", "E", "F#", "G#"]),
  Bb: new Set(["Bb", "C", "D", "Eb", "F", "G", "A"]),
  B: new Set(["B", "C#", "D#", "E", "F#", "G#", "A#"]),
};

function toKeyChord(root: string, qualitySuffix: string): string {
  const isMinor = /^m($|[^a])/.test(qualitySuffix);
  return root + (isMinor ? "m" : "");
}

function hasAccidental(note: string): boolean {
  return /[#b]/.test(note);
}

interface ParsedInfo {
  root: string;
  quality: string;
  slash: string | null;
}

interface RecoverableToken {
  text: string;
  isChordRecognized: boolean;
  isSuspect: boolean;
}

function buildParsedMap<T extends RecoverableToken>(
  tokens: T[],
): Map<T, ParsedInfo> {
  const map = new Map<T, ParsedInfo>();
  for (const t of tokens) {
    if (!t.isChordRecognized) continue;
    const p = parseChordSymbol(t.text);
    if (p.rootNote) {
      map.set(t, {
        root: p.rootNote,
        quality: p.qualitySymbol ?? "",
        slash: p.slashBass,
      });
    }
  }
  return map;
}

interface KeyDetectionResult {
  key: string;
  sharpCount: number;
}

interface DetectKeyOptions {
  requireSharpCorrections?: boolean;
}

function detectKey(
  parsedInfos: ParsedInfo[],
  firstRoot: string | null,
  options?: DetectKeyOptions,
): KeyDetectionResult | null {
  const requireSharps = options?.requireSharpCorrections ?? true;
  let bestKey = "";
  let bestScore = 0;
  let bestSharpCount = 0;

  for (const [key, diatonicChords] of Object.entries(DIATONIC)) {
    const diatonicSet = new Set(diatonicChords);
    let score = 0;
    let sharpCorrections = 0;

    for (const info of parsedInfos) {
      const kc = toKeyChord(info.root, info.quality);

      if (diatonicSet.has(kc)) {
        score++;
        continue;
      }

      if (hasAccidental(info.root)) continue;

      const sharpRoot = info.root + "#";
      if (diatonicSet.has(toKeyChord(sharpRoot, info.quality))) {
        score++;
        sharpCorrections++;
        continue;
      }

      if (!info.quality.startsWith("m") || info.quality.startsWith("maj")) {
        if (diatonicSet.has(sharpRoot + "m")) {
          score++;
          sharpCorrections++;
        }
      }
    }

    if (firstRoot && key === firstRoot) {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
      bestSharpCount = sharpCorrections;
    }
  }

  if (!bestKey || bestScore < parsedInfos.length * 0.5) {
    return null;
  }

  if (requireSharps && bestSharpCount === 0) {
    return null;
  }

  return { key: bestKey, sharpCount: bestSharpCount };
}

export function recoverDroppedSharps<T extends RecoverableToken>(tokens: T[]): T[] {
  const parsedMap = buildParsedMap(tokens);
  if (parsedMap.size < 3) return tokens;

  const firstRoot = parsedMap.values().next().value?.root ?? null;
  const detected = detectKey([...parsedMap.values()], firstRoot);
  if (!detected) return tokens;

  const diatonicSet = new Set(DIATONIC[detected.key]);
  const scaleNotes = SCALE_NOTES[detected.key];

  return tokens.map((token) => {
    const info = parsedMap.get(token);
    if (!info || hasAccidental(info.root)) return token;

    const kc = toKeyChord(info.root, info.quality);
    const sharpRoot = info.root + "#";
    let newRoot = info.root;
    let newQuality = info.quality;

    if (!diatonicSet.has(kc)) {
      if (diatonicSet.has(toKeyChord(sharpRoot, info.quality))) {
        newRoot = sharpRoot;
      } else if (info.quality === "" && diatonicSet.has(sharpRoot + "m")) {
        // Only promote a bare note letter (e.g. "D" -> "D#m"); never prepend "m"
        // onto an existing quality, which would build invalid symbols like
        // "mmaj7" or "msus4".
        newRoot = sharpRoot;
        newQuality = "m";
      }
    }

    let newSlash = info.slash;
    if (newSlash && !hasAccidental(newSlash) && scaleNotes) {
      if (!scaleNotes.has(newSlash) && scaleNotes.has(newSlash + "#")) {
        newSlash = newSlash + "#";
      }
    }

    if (newRoot === info.root && newSlash === info.slash) return token;

    const corrected = formatChordSymbol({
      rootNote: newRoot,
      qualitySymbol: newQuality,
      slashBass: newSlash,
    });

    return { ...token, text: corrected, isSuspect: true };
  });
}

interface MergeableToken extends RecoverableToken {
  lineIndex: number;
  wordIndex: number;
  confidence: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function mergeAdjacentSlashBass<T extends MergeableToken>(tokens: T[]): T[] {
  const parsedMap = buildParsedMap(tokens);
  if (parsedMap.size < 3) return tokens;

  const firstRoot = parsedMap.values().next().value?.root ?? null;
  const detected = detectKey([...parsedMap.values()], firstRoot, {
    requireSharpCorrections: false,
  });
  if (!detected) return tokens;

  const diatonicSet = new Set(DIATONIC[detected.key]);
  const scaleNotes = SCALE_NOTES[detected.key];
  const result: T[] = [];
  let i = 0;

  while (i < tokens.length) {
    const current = tokens[i];
    const next = tokens[i + 1];

    if (
      current && next &&
      current.isChordRecognized && next.isChordRecognized &&
      current.lineIndex === next.lineIndex &&
      next.wordIndex === current.wordIndex + 1
    ) {
      const currentInfo = parsedMap.get(current);
      const nextInfo = parsedMap.get(next);

      if (currentInfo && nextInfo && !nextInfo.quality && !nextInfo.slash) {
        const bareChord = toKeyChord(nextInfo.root, "");
        const isDiatonic = diatonicSet.has(bareChord);

        const currentRight =
          current.x !== undefined && current.width !== undefined
            ? current.x + current.width
            : undefined;
        const nextLeft = next.x;
        const pixelGap =
          currentRight !== undefined && nextLeft !== undefined
            ? nextLeft - currentRight
            : undefined;
        const heightRef = current.height ?? next.height ?? 14;
        const looksLikeOneWord = pixelGap !== undefined && pixelGap < heightRef * 0.3;

        if (!isDiatonic && looksLikeOneWord) {
          let bassNote = nextInfo.root;
          if (!hasAccidental(bassNote) && scaleNotes) {
            if (!scaleNotes.has(bassNote) && scaleNotes.has(bassNote + "#")) {
              bassNote = bassNote + "#";
            }
          }

          const slashChord = `${current.text}/${bassNote}`;
          const parsed = normalizeChordSymbol(slashChord);
          if (parsed.isSupported) {
            result.push({
              ...current,
              text: parsed.normalizedChordSymbol,
              isSuspect: true,
            } as T);
            i += 2;
            continue;
          }
        }
      }
    }

    result.push(current);
    i++;
  }

  return result;
}
