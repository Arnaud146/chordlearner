import type { OCRTokenReviewItem } from "./ocr-postprocess";

/**
 * Token-level fusion of two OCR providers.
 *
 * `auto.compare` runs both providers and previously kept the better one entirely,
 * discarding the other's reads. This recovers chords the better provider ("spine")
 * missed but the other ("donor") recognized: for each unrecognized spine token, if
 * the donor placed a recognized chord between the same neighboring chords, the spine
 * token is upgraded to it.
 *
 * The spine keeps its structure and coordinates (the two providers don't share a
 * coordinate space, so nothing is matched spatially); only the text of individual
 * unrecognized tokens is upgraded, and only when both neighbors agree — keeping the
 * fusion high precision.
 */

function recognizedTexts(tokens: OCRTokenReviewItem[]): string[] {
  return tokens.filter((token) => token.isChordRecognized).map((token) => token.text);
}

/** The recognized chord the donor read between `prev` and `next` chords, if any. */
function donorChordBetween(
  donor: string[],
  prev: string | null,
  next: string | null,
): string | null {
  if (prev !== null && next !== null) {
    // Require an unambiguous fill: if the donor read the same prev…next pair more
    // than once with different chords between them, we can't tell which belongs in
    // the spine's hole, so we decline rather than insert a confidently-wrong chord.
    let found: string | null = null;
    for (let i = 0; i <= donor.length - 3; i += 1) {
      if (donor[i] === prev && donor[i + 2] === next) {
        if (found !== null && found !== donor[i + 1]) return null;
        found = donor[i + 1];
      }
    }
    return found;
  }

  // Hole at the end of the spine: prev is the donor's second-to-last chord.
  if (prev !== null) {
    if (donor.length >= 2 && donor[donor.length - 2] === prev) {
      return donor[donor.length - 1];
    }
    return null;
  }

  // Hole at the start of the spine: next is the donor's second chord.
  if (next !== null) {
    if (donor.length >= 2 && donor[1] === next) return donor[0];
    return null;
  }

  return null;
}

export function fuseProviderTokens(
  spine: OCRTokenReviewItem[],
  donor: OCRTokenReviewItem[],
): OCRTokenReviewItem[] {
  const donorChords = recognizedTexts(donor);
  if (donorChords.length === 0) return spine;

  const prevChord: Array<string | null> = new Array(spine.length).fill(null);
  let lastRecognized: string | null = null;
  for (let i = 0; i < spine.length; i += 1) {
    prevChord[i] = lastRecognized;
    if (spine[i].isChordRecognized) lastRecognized = spine[i].text;
  }

  const nextChord: Array<string | null> = new Array(spine.length).fill(null);
  let upcomingRecognized: string | null = null;
  for (let i = spine.length - 1; i >= 0; i -= 1) {
    nextChord[i] = upcomingRecognized;
    if (spine[i].isChordRecognized) upcomingRecognized = spine[i].text;
  }

  return spine.map((token, i) => {
    if (token.isChordRecognized) return token;
    const filled = donorChordBetween(donorChords, prevChord[i], nextChord[i]);
    if (!filled) return token;
    return { ...token, text: filled, isChordRecognized: true, isSuspect: true };
  });
}
