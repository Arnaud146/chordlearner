import { describe, expect, it } from "vitest";
import { classifyLine, classifyLines } from "./classify-lines";

describe("classify-lines", () => {
  it("classifies section headings", () => {
    expect(classifyLine("[Verse 1]", 0).type).toBe("section");
    expect(classifyLine("Chorus:", 1).type).toBe("section");
  });

  it("classifies chord-only lines", () => {
    const line = classifyLine("C   G   Am   Fmaj7", 0);
    expect(line.type).toBe("chord_line");
    expect(line.chords).toEqual(["C", "G", "Am", "Fmaj7"]);
  });

  it("classifies lyric lines", () => {
    const line = classifyLine("When I find myself in times of trouble", 0);
    expect(line.type).toBe("lyric_line");
    expect(line.chords).toEqual([]);
  });

  it("classifies mixed lines", () => {
    const line = classifyLine("C         G       When I find myself", 0);
    expect(line.type).toBe("mixed_line");
    expect(line.chords).toEqual(["C", "G"]);
    expect(line.lyrics).toContain("When");
  });

  it("classifies empty lines", () => {
    expect(classifyLine("   ", 0).type).toBe("empty");
  });

  it("classifies a full block", () => {
    const lines = classifyLines(["[Intro]", "C G Am F", "", "When I find myself"]);
    expect(lines.map((line) => line.type)).toEqual([
      "section",
      "chord_line",
      "empty",
      "lyric_line",
    ]);
  });
});
