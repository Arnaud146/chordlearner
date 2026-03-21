import { describe, expect, it } from "vitest";
import { suggestRightHandFingering } from "./fingering-engine";
import { generateRightHandVoicings } from "./voicing-engine";

describe("voicing engine RH", () => {
  it("generates triad voicings with inversions", () => {
    const voicings = generateRightHandVoicings("C");
    expect(voicings.length).toBe(3);
    expect(voicings[0].inversionIndex).toBe(0);
    expect(voicings[1].inversionIndex).toBe(1);
    expect(voicings[2].inversionIndex).toBe(2);
    expect(voicings[0].notesScientific).toEqual(["C4", "E4", "G4"]);
  });

  it("generates compact 7th voicings", () => {
    const voicings = generateRightHandVoicings("Dm7");
    expect(voicings.length).toBeGreaterThanOrEqual(2);
    expect(voicings[0].notesScientific).toEqual(["D4", "F4", "A4", "C5"]);
    expect(voicings[0].notesMidi.length).toBe(4);
  });

  it("handles slash chord metadata", () => {
    const voicings = generateRightHandVoicings("C/E");
    expect(voicings[0].slashBass).toBe("E");
    expect(voicings[0].slashBassMidi).not.toBeNull();
  });
});

describe("fingering engine", () => {
  it("suggests basic triad fingering", () => {
    expect(suggestRightHandFingering([60, 64, 67]).rightHand).toEqual([1, 3, 5]);
  });

  it("suggests basic 4-note fingering", () => {
    expect(suggestRightHandFingering([62, 65, 69, 72]).rightHand).toEqual([
      1, 2, 4, 5,
    ]);
  });
});
