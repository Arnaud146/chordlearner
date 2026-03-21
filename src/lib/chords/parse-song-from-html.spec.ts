import { describe, expect, it } from "vitest";
import {
  extractBoiteAChansonsRawLines,
  parseSongFromHtml,
  stripTranspositionControls,
} from "./parse-song-from-html";

describe("parse-song-from-html", () => {
  it("removes transposition controls before parsing chords/lyrics (generic)", () => {
    const html = `
      <html>
        <head>
          <title>All You Need Is Love - THE BEATLES</title>
        </head>
        <body>
          <article class="song-content">
            <div>Tonalite : D | Eb | E | F | Gb | G | Ab | A | Bb | B | C | Db | D</div>
            <div>G    D/F#    Em</div>
            <div>Love love love</div>
            <div>G    D/F#    Em</div>
            <div>Love love love</div>
          </article>
        </body>
      </html>
    `;

    const result = parseSongFromHtml({
      sourceUrl: "https://example.com/all-you-need-is-love",
      html,
    });

    const rawLines = result.song.sections.flatMap((section) =>
      section.lines.map((line) => line.raw),
    );
    expect(rawLines.some((line) => /tonalit/i.test(line))).toBe(false);
    expect(result.song.allChords).toContain("G");
    expect(result.song.allChords).toContain("D/F#");
    expect(result.song.allChords).toContain("Em");
  });

  it("parses boitachansons divPartition and ignores tonalite selector", () => {
    const html = `
      <html>
        <body>
          <h1>
            <div id="dTitreChanson">LET IT BE</div>
          </h1>
          <div class="dTonalite">
            Tonalite :
            <ul class="ulTonalListe">
              <li class="liTonalElmt">D</li>
              <li class="liTonalElmt">Eb</li>
              <li class="liTonalElmt">E</li>
              <li class="liTonalElmt">F</li>
              <li class="liTonalElmt">Gb</li>
              <li class="liTonalElmt">G</li>
            </ul>
          </div>
          <div id="divPartition" class="divPartition">
            <div class="pL"> When I <span class="sI"><span class="a" data-a="C"></span></span>find myself in <span class="sI"><span class="a" data-a="G"></span></span>times of trouble</div>
            <div class="pL"> <span class="sI"><span class="a" data-a="Am"></span></span>Mother Mary<span class="sI"><span class="a" data-a="F"></span></span> comes to me</div>
            <div class="pLI"> <span class="ALI"><span class="a" data-a="F"></span></span> <span class="ALI"><span class="a" data-a="C/E"></span></span> / <span class="ALI"><span class="a" data-a="Dm7"></span></span> <span class="ALI"><span class="a" data-a="C"></span></span></div>
            <div class="pLS">(Solo de guitare)</div>
          </div>
          <script>console.log("end")</script>
        </body>
      </html>
    `;

    const rawLines = extractBoiteAChansonsRawLines(html);
    expect(rawLines.some((line) => /tonalit/i.test(line))).toBe(false);
    expect(rawLines).toContain("C G");
    expect(rawLines).toContain("Am F");
    expect(rawLines).toContain("[Solo de guitare]");

    const parsed = parseSongFromHtml({
      sourceUrl: "https://www.boiteachansons.net/partitions/the-beatles/let-it-be",
      html,
    });

    expect(parsed.debug.selectedExtractor).toBe("boiteachansons-extractor");
    expect(parsed.song.allChords).toEqual(["Am", "C", "C/E", "Dm7", "F", "G"]);
  });
});

describe("stripTranspositionControls", () => {
  it("drops tonalite heading and key options listed on multiple lines", () => {
    const cleaned = stripTranspositionControls([
      "Tonalite :",
      "D",
      "Eb",
      "E",
      "F",
      "Gb",
      "G",
      "Ab",
      "A",
      "Bb",
      "B",
      "C",
      "Db",
      "D",
      "G    D/F#    Em",
      "There's nothing you can do that can't be done",
    ]);

    expect(cleaned).toEqual([
      "G    D/F#    Em",
      "There's nothing you can do that can't be done",
    ]);
  });

  it("keeps real chord lines after tonalite label when no key selector is present", () => {
    const cleaned = stripTranspositionControls([
      "Tonalite :",
      "G C D",
      "Love is all you need",
    ]);

    expect(cleaned).toEqual(["G C D", "Love is all you need"]);
  });
});
