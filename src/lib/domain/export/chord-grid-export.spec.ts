import { describe, expect, it } from "vitest";
import type { ChordOccurrenceRow } from "@/lib/types/db";
import {
  buildChordLines,
  buildExportFilename,
  buildExportMeta,
  paginateExportLines,
} from "./chord-grid-export";

function makeOccurrence(params: {
  id: string;
  lineIndex: number;
  tokenIndex: number;
  symbol: string;
}): ChordOccurrenceRow {
  return {
    id: params.id,
    song_id: "song-1",
    line_index: params.lineIndex,
    token_index: params.tokenIndex,
    section_label: null,
    chord_symbol_raw: params.symbol,
    chord_symbol_corrected: null,
    normalized_chord_symbol: params.symbol,
    base_chord_normalized: params.symbol,
    slash_bass: null,
    is_recognized: true,
    is_user_corrected: false,
    parse_error_code: null,
    position_start: null,
    position_end: null,
    created_at: "2026-03-05T00:00:00.000Z",
  };
}

describe("chord-grid-export domain", () => {
  it("builds chord lines ordered by line and token indexes", () => {
    const occurrences: ChordOccurrenceRow[] = [
      makeOccurrence({ id: "1", lineIndex: 1, tokenIndex: 1, symbol: "G" }),
      makeOccurrence({ id: "2", lineIndex: 0, tokenIndex: 1, symbol: "Am" }),
      makeOccurrence({ id: "3", lineIndex: 0, tokenIndex: 0, symbol: "C" }),
      makeOccurrence({ id: "4", lineIndex: 1, tokenIndex: 0, symbol: "F" }),
    ];

    expect(buildChordLines(occurrences)).toEqual(["C Am", "F G"]);
  });

  it("paginates lines with a fixed lines-per-page value", () => {
    const lines = ["L1", "L2", "L3", "L4", "L5"];
    expect(paginateExportLines(lines, { linesPerPage: 2 })).toEqual([
      ["L1", "L2"],
      ["L3", "L4"],
      ["L5"],
    ]);
  });

  it("returns an empty page when there are no lines", () => {
    expect(paginateExportLines([], { linesPerPage: 20 })).toEqual([[]]);
  });

  it("builds stable filenames and page suffixes", () => {
    expect(
      buildExportFilename({
        title: "Mon Morceau",
        keyContext: "F#",
        format: "pdf",
      }),
    ).toBe("mon-morceau-f.pdf");

    expect(
      buildExportFilename({
        title: "Mon Morceau",
        keyContext: "F#",
        format: "png",
        pageIndex: 1,
        totalPages: 3,
      }),
    ).toBe("mon-morceau-f-p2.png");
  });

  it("builds export metadata from song inputs", () => {
    expect(
      buildExportMeta({
        songTitle: "Titre",
        songArtist: null,
        currentKey: "D",
        notationPreference: "sharps",
      }),
    ).toEqual({
      title: "Titre",
      artistLabel: "Artist: Unknown artist",
      keyLabel: "Key: D",
      notationLabel: "Notation: sharps",
    });
  });
});
