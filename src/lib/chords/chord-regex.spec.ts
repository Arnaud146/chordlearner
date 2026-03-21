import { describe, expect, it } from "vitest";
import {
  extractChordTokens,
  isChordToken,
  normalizeChord,
} from "./chord-regex";

describe("chord-regex", () => {
  it("recognizes common chord tokens", () => {
    const supported = [
      "C",
      "G",
      "Am",
      "F6",
      "Fmaj7",
      "Dm7",
      "C/E",
      "Am/G",
      "Bb",
      "F/A",
      "Gsus4",
      "A7",
      "Em9",
      "Cadd9",
      "Bdim",
      "Eaug",
      "E+",
      "F#m",
      "F♯m",
    ];

    for (const chord of supported) {
      expect(isChordToken(chord)).toBe(true);
    }
  });

  it("avoids false positives on natural words", () => {
    const unsupported = ["amour", "bridge", "hello", "world", "When", "times"];
    for (const token of unsupported) {
      expect(isChordToken(token)).toBe(false);
    }
  });

  it("extracts and normalizes chords from a mixed line", () => {
    const line = "C   G   Am/G   Fmaj7 E+, when I find myself";
    expect(extractChordTokens(line)).toEqual(["C", "G", "Am/G", "Fmaj7", "Eaug"]);
    expect(normalizeChord("F♯m7")).toBe("F#m7");
    expect(normalizeChord("E+")).toBe("Eaug");
  });
});
