import { describe, expect, it } from "vitest";
import { postprocessOCRTokens } from "./ocr-postprocess";

describe("ocr postprocess", () => {
  it("flags suspect and unknown tokens", () => {
    const result = postprocessOCRTokens([
      { text: "C", confidence: 95, lineIndex: 0, wordIndex: 0 },
      { text: "H13", confidence: 90, lineIndex: 0, wordIndex: 1 },
      { text: "Dm7", confidence: 55, lineIndex: 1, wordIndex: 0 },
    ]);

    expect(result.lines).toEqual(["C H13", "Dm7"]);
    expect(result.tokens[0].isChordRecognized).toBe(true);
    expect(result.tokens[1].isChordRecognized).toBe(false);
    expect(result.tokens[1].isSuspect).toBe(true);
    expect(result.tokens[2].isSuspect).toBe(true);
  });

  it("keeps only recognized chords when chordsOnly is enabled", () => {
    const result = postprocessOCRTokens(
      [
        { text: "C", confidence: 95, lineIndex: 0, wordIndex: 0 },
        { text: "intro", confidence: 99, lineIndex: 0, wordIndex: 1 },
        { text: "Dm7", confidence: 80, lineIndex: 1, wordIndex: 0 },
      ],
      { chordsOnly: true },
    );

    expect(result.lines).toEqual(["C", "Dm7"]);
    expect(result.tokens).toHaveLength(2);
    expect(result.tokens.every((token) => token.isChordRecognized)).toBe(true);
  });

  it("merges slash chords split across multiple OCR tokens", () => {
    const result = postprocessOCRTokens(
      [
        { text: "Am", confidence: 93, lineIndex: 0, wordIndex: 0 },
        { text: "/G", confidence: 91, lineIndex: 0, wordIndex: 1 },
        { text: "C", confidence: 94, lineIndex: 1, wordIndex: 0 },
        { text: "/", confidence: 90, lineIndex: 1, wordIndex: 1 },
        { text: "E", confidence: 89, lineIndex: 1, wordIndex: 2 },
      ],
      { chordsOnly: true },
    );

    expect(result.lines).toEqual(["Am/G", "C/E"]);
    expect(result.tokens.map((token) => token.text)).toEqual(["Am/G", "C/E"]);
  });

  it("corrects slash separator OCR mistakes", () => {
    const result = postprocessOCRTokens(
      [{ text: "C|E", confidence: 88, lineIndex: 0, wordIndex: 0 }],
      { chordsOnly: true },
    );

    expect(result.lines).toEqual(["C/E"]);
    expect(result.tokens[0].isChordRecognized).toBe(true);
    expect(result.tokens[0].text).toBe("C/E");
  });

  it("aligns chord lines to lyric lines and ignores lyric false positives", () => {
    const result = postprocessOCRTokens(
      [
        { text: "C", confidence: 95, lineIndex: 0, wordIndex: 0, x: 20, y: 10, height: 14 },
        { text: "G", confidence: 95, lineIndex: 1, wordIndex: 0, x: 120, y: 11, height: 14 },
        { text: "Am", confidence: 95, lineIndex: 2, wordIndex: 0, x: 220, y: 10, height: 14 },
        { text: "Am/G", confidence: 95, lineIndex: 3, wordIndex: 0, x: 300, y: 11, height: 14 },
        { text: "Fmaj7", confidence: 95, lineIndex: 4, wordIndex: 0, x: 390, y: 10, height: 14 },
        { text: "F6", confidence: 95, lineIndex: 5, wordIndex: 0, x: 490, y: 11, height: 14 },
        { text: "When", confidence: 95, lineIndex: 6, wordIndex: 0, x: 20, y: 42, height: 14 },
        { text: "I", confidence: 95, lineIndex: 6, wordIndex: 1, x: 75, y: 42, height: 14 },
        { text: "find", confidence: 95, lineIndex: 6, wordIndex: 2, x: 95, y: 42, height: 14 },
        { text: "myself", confidence: 95, lineIndex: 6, wordIndex: 3, x: 130, y: 42, height: 14 },
        { text: "E", confidence: 95, lineIndex: 6, wordIndex: 4, x: 190, y: 42, height: 14 },
        { text: "times", confidence: 95, lineIndex: 6, wordIndex: 5, x: 215, y: 42, height: 14 },
        { text: "trouble", confidence: 95, lineIndex: 6, wordIndex: 6, x: 255, y: 42, height: 14 },
        { text: "C/E", confidence: 95, lineIndex: 7, wordIndex: 0, x: 20, y: 74, height: 14 },
        { text: "Dm7", confidence: 95, lineIndex: 8, wordIndex: 0, x: 120, y: 74, height: 14 },
        { text: "C", confidence: 95, lineIndex: 9, wordIndex: 0, x: 210, y: 74, height: 14 },
        { text: "Speaking", confidence: 95, lineIndex: 10, wordIndex: 0, x: 20, y: 106, height: 14 },
        { text: "words", confidence: 95, lineIndex: 10, wordIndex: 1, x: 95, y: 106, height: 14 },
        { text: "of", confidence: 95, lineIndex: 10, wordIndex: 2, x: 145, y: 106, height: 14 },
        { text: "wisdom", confidence: 95, lineIndex: 10, wordIndex: 3, x: 170, y: 106, height: 14 },
      ],
      { chordsOnly: true },
    );

    expect(result.lines).toEqual(["C G Am Am/G Fmaj7 F6", "C/E Dm7 C"]);
    expect(result.tokens.map((token) => token.text)).toEqual([
      "C",
      "G",
      "Am",
      "Am/G",
      "Fmaj7",
      "F6",
      "C/E",
      "Dm7",
      "C",
    ]);
  });

  it("groups chords with same horizontal axis into the same field", () => {
    const result = postprocessOCRTokens(
      [
        { text: "C", confidence: 95, lineIndex: 0, wordIndex: 0, x: 20, y: 12, height: 12 },
        { text: "G", confidence: 95, lineIndex: 3, wordIndex: 0, x: 120, y: 13, height: 12 },
        { text: "Am", confidence: 95, lineIndex: 8, wordIndex: 0, x: 220, y: 12, height: 12 },
        { text: "F", confidence: 95, lineIndex: 1, wordIndex: 0, x: 20, y: 62, height: 12 },
        { text: "C/E", confidence: 95, lineIndex: 2, wordIndex: 0, x: 120, y: 63, height: 12 },
      ],
      { chordsOnly: true },
    );

    expect(result.lines).toEqual(["C G Am", "F C/E"]);
  });

  it("recognizes F#m and E+ as valid chords in chordsOnly mode", () => {
    const result = postprocessOCRTokens(
      [
        { text: "F#m", confidence: 95, lineIndex: 0, wordIndex: 0 },
        { text: "E+", confidence: 94, lineIndex: 0, wordIndex: 1 },
      ],
      { chordsOnly: true },
    );

    expect(result.lines).toEqual(["F#m Eaug"]);
    expect(result.tokens.map((token) => token.text)).toEqual(["F#m", "Eaug"]);
    expect(result.tokens.every((token) => token.isChordRecognized)).toBe(true);
  });
});
