import { describe, expect, it } from "vitest";
import { suggestChordByDictionary } from "./ocr-dictionary-correct";

describe("ocr dictionary correction", () => {
  it("fixes single confusion errors", () => {
    expect(suggestChordByDictionary("8b")).toBe("Bb");
    expect(suggestChordByDictionary("6m")).toBe("Gm");
  });

  it("fixes a confusion-corrupted root while keeping a letter-only quality", () => {
    // 6 -> G confusion, "dim" quality preserved.
    expect(suggestChordByDictionary("6dim")).toBe("Gdim");
  });

  it("fixes case errors on the root note", () => {
    expect(suggestChordByDictionary("am")).toBe("Am");
  });

  it("corrects each side of a slash chord independently", () => {
    expect(suggestChordByDictionary("8/6")).toBe("B/G");
  });

  it("returns null for lyric words", () => {
    expect(suggestChordByDictionary("Hello")).toBeNull();
    expect(suggestChordByDictionary("love")).toBeNull();
    expect(suggestChordByDictionary("wisdom")).toBeNull();
  });

  it("returns null when nothing is close enough", () => {
    expect(suggestChordByDictionary("XYZ123")).toBeNull();
    expect(suggestChordByDictionary("")).toBeNull();
  });

  it("leaves already-valid chords reachable (round-trips to canonical)", () => {
    expect(suggestChordByDictionary("Am7")).toBe("Am7");
  });
});
