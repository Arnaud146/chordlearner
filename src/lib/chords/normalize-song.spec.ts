import { describe, expect, it } from "vitest";
import { normalizeStructuredSong } from "./normalize-song";

describe("normalize-song", () => {
  it("rebuilds sections and structured lines", () => {
    const result = normalizeStructuredSong({
      sourceUrl: "https://example.com/let-it-be",
      title: "Let It Be - Chords",
      mode: "web",
      rawLines: [
        "[Intro]",
        "C    G    Am    Fmaj7 F6",
        "",
        "[Verse 1]",
        "C        G        Am   Am/G   Fmaj7   F6",
        "When I find myself in times of trouble Mother Mary comes to me",
      ],
    });

    expect(result.title).toBe("Let It Be");
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].type).toBe("intro");
    expect(result.sections[1].type).toBe("verse");
    expect(result.sections[1].index).toBe(1);
    expect(result.allChords).toEqual(["Am", "Am/G", "C", "F6", "Fmaj7", "G"]);
    expect(result.stats.sections).toBe(2);
    expect(result.stats.chordLines).toBe(2);
    expect(result.stats.lyricLines).toBe(1);
  });
});
