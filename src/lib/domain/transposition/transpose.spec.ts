import { describe, expect, it } from "vitest";
import { transposeChordSymbol } from "./transpose-chord";
import { getSemitoneDelta, transposeNote } from "./transpose-note";

describe("transposition", () => {
  it("transposes simple chord C -> D", () => {
    const delta = getSemitoneDelta("C", "D");
    expect(
      transposeChordSymbol({
        chordSymbol: "C",
        semitoneDelta: delta,
        notationPreference: "auto",
        targetKey: "D",
      }),
    ).toBe("D");
  });

  it("transposes slash chord D/F# -> E/G#", () => {
    const delta = getSemitoneDelta("D", "E");
    expect(
      transposeChordSymbol({
        chordSymbol: "D/F#",
        semitoneDelta: delta,
        notationPreference: "sharps",
        targetKey: "E",
      }),
    ).toBe("E/G#");
  });

  it("applies sharps/flats notation preference", () => {
    expect(
      transposeNote({
        note: "C",
        semitoneDelta: 1,
        notationPreference: "sharps",
        targetKey: "D",
      }),
    ).toBe("C#");
    expect(
      transposeNote({
        note: "C",
        semitoneDelta: 1,
        notationPreference: "flats",
        targetKey: "Db",
      }),
    ).toBe("Db");
  });
});
