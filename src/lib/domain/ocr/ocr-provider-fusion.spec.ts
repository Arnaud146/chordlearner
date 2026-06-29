import { describe, expect, it } from "vitest";
import { fuseProviderTokens } from "./ocr-provider-fusion";
import type { OCRTokenReviewItem } from "./ocr-postprocess";

function token(
  text: string,
  isChordRecognized: boolean,
  wordIndex: number,
): OCRTokenReviewItem {
  return {
    text,
    confidence: 90,
    lineIndex: 0,
    wordIndex,
    isChordRecognized,
    isSuspect: !isChordRecognized,
    correctionSuggestion: null,
  };
}

describe("ocr provider fusion", () => {
  it("upgrades a missed chord between two matching neighbors", () => {
    const spine = [
      token("C", true, 0),
      token("flm", false, 1),
      token("G", true, 2),
    ];
    const donor = [token("C", true, 0), token("Am", true, 1), token("G", true, 2)];

    const fused = fuseProviderTokens(spine, donor);

    expect(fused.map((t) => t.text)).toEqual(["C", "Am", "G"]);
    expect(fused[1].isChordRecognized).toBe(true);
    expect(fused[1].isSuspect).toBe(true);
  });

  it("fills a hole at the end of the spine", () => {
    const spine = [token("C", true, 0), token("G", true, 1), token("???", false, 2)];
    const donor = [token("C", true, 0), token("G", true, 1), token("Am", true, 2)];

    const fused = fuseProviderTokens(spine, donor);

    expect(fused.map((t) => t.text)).toEqual(["C", "G", "Am"]);
  });

  it("fills a hole at the start of the spine", () => {
    const spine = [token("xx", false, 0), token("C", true, 1), token("G", true, 2)];
    const donor = [token("Am", true, 0), token("C", true, 1), token("G", true, 2)];

    const fused = fuseProviderTokens(spine, donor);

    expect(fused.map((t) => t.text)).toEqual(["Am", "C", "G"]);
  });

  it("does not upgrade when the donor's neighbors disagree", () => {
    const spine = [
      token("C", true, 0),
      token("zz", false, 1),
      token("G", true, 2),
    ];
    const donor = [token("D", true, 0), token("Am", true, 1), token("E", true, 2)];

    const fused = fuseProviderTokens(spine, donor);

    expect(fused.map((t) => t.text)).toEqual(["C", "zz", "G"]);
    expect(fused[1].isChordRecognized).toBe(false);
  });

  it("returns the spine untouched when the donor has no chords", () => {
    const spine = [token("C", true, 0), token("nope", false, 1)];

    const fused = fuseProviderTokens(spine, []);

    expect(fused).toEqual(spine);
  });
});
