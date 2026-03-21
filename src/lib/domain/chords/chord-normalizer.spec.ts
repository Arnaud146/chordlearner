import { describe, expect, it } from "vitest";
import { normalizeChordSymbol } from "./chord-normalizer";
import { tokenizeChordText } from "./chord-tokenizer";

describe("chord normalization", () => {
  it("normalizes major7 variants to maj7", () => {
    expect(normalizeChordSymbol("CM7").normalizedChordSymbol).toBe("Cmaj7");
    expect(normalizeChordSymbol("CΔ7").normalizedChordSymbol).toBe("Cmaj7");
    expect(normalizeChordSymbol("Cmaj7").normalizedChordSymbol).toBe("Cmaj7");
  });

  it("supports slash chords", () => {
    const chord = normalizeChordSymbol("D/F#");
    expect(chord.isSupported).toBe(true);
    expect(chord.rootNote).toBe("D");
    expect(chord.slashBass).toBe("F#");
    expect(chord.normalizedChordSymbol).toBe("D/F#");
  });

  it("normalizes unicode accidentals and detects minor sharp chords", () => {
    expect(normalizeChordSymbol("F♯").normalizedChordSymbol).toBe("F#");
    expect(normalizeChordSymbol("D♭m7").normalizedChordSymbol).toBe("Dbm7");
    expect(normalizeChordSymbol("F♯m").normalizedChordSymbol).toBe("F#m");
    expect(normalizeChordSymbol("F#m").isSupported).toBe(true);
  });

  it("supports augmented plus notation", () => {
    const augmented = normalizeChordSymbol("E+");
    expect(augmented.isSupported).toBe(true);
    expect(augmented.qualityCanonical).toBe("augmented");
    expect(augmented.normalizedChordSymbol).toBe("Eaug");
  });

  it("keeps unknown chords as unsupported without crashing", () => {
    const unknown = normalizeChordSymbol("H13");
    expect(unknown.isSupported).toBe(false);
    expect(unknown.normalizedChordSymbol).toBe("H13");
    expect(unknown.parseErrorCode).toBe("INVALID_ROOT");
  });
});

describe("chord tokenizer", () => {
  it("tokenizes a simple grid", () => {
    const tokens = tokenizeChordText("C   G   Am   F\nDm7   G   C/E");
    expect(tokens.map((token) => token.value)).toEqual([
      "C",
      "G",
      "Am",
      "F",
      "Dm7",
      "G",
      "C/E",
    ]);
  });

  it("keeps augmented and sharp-minor tokens", () => {
    const tokens = tokenizeChordText("E+   F#m   A");
    expect(tokens.map((token) => token.value)).toEqual(["E+", "F#m", "A"]);
  });

  it("merges split sharp/minor/aug tokens", () => {
    const tokens = tokenizeChordText("A G # D E7\nA F # m D E7\nA E + F # m Dm7");
    expect(tokens.map((token) => token.value)).toEqual([
      "A",
      "G#",
      "D",
      "E7",
      "A",
      "F#m",
      "D",
      "E7",
      "A",
      "E+",
      "F#m",
      "Dm7",
    ]);
  });

  it("ignores lowercase lyric article token", () => {
    const tokens = tokenizeChordText("I get up and fix myself a drink\nA G# D E7");
    expect(tokens.map((token) => token.value)).toEqual(["A", "G#", "D", "E7"]);
  });
});
