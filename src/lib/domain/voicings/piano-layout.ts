export interface PianoKey {
  midi: number;
  note: string;
  isBlack: boolean;
}

const NOTE_ORDER = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const NATURAL_TO_MIDI: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function noteToPitchClass(note: string): number {
  const trimmed = note.trim();
  const match = trimmed.match(/^([A-G])([#b]?)$/);
  if (!match) {
    throw new Error(`Invalid note: ${note}`);
  }
  const natural = NATURAL_TO_MIDI[match[1]];
  const accidental = match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0;
  return (natural + accidental + 12) % 12;
}

export function noteToMidi(note: string, octave: number): number {
  return 12 * (octave + 1) + noteToPitchClass(note);
}

function midiToNote(midi: number): string {
  const pitchClass = ((midi % 12) + 12) % 12;
  return NOTE_ORDER[pitchClass];
}

export function midiToScientific(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${midiToNote(midi)}${octave}`;
}

export function buildKeyboardRange(minMidi = 48, maxMidi = 83): PianoKey[] {
  const keys: PianoKey[] = [];
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    const note = midiToNote(midi);
    keys.push({
      midi,
      note,
      isBlack: note.includes("#"),
    });
  }
  return keys;
}
