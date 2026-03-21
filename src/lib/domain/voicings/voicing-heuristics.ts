export function scoreVoicingCompactness(notesMidi: number[]): number {
  if (notesMidi.length <= 1) return 1;
  const sorted = [...notesMidi].sort((a, b) => a - b);
  const range = sorted[sorted.length - 1] - sorted[0];
  if (range <= 7) return 1;
  if (range <= 12) return 2;
  if (range <= 16) return 3;
  if (range <= 20) return 4;
  return 5;
}

export function scoreVoicingRegister(notesMidi: number[]): number {
  if (notesMidi.length === 0) return 3;
  const avg = notesMidi.reduce((acc, note) => acc + note, 0) / notesMidi.length;
  // Right hand beginner-friendly center around C4-G4 (60-67)
  const distance = Math.abs(avg - 64);
  if (distance <= 2) return 1;
  if (distance <= 5) return 2;
  if (distance <= 8) return 3;
  if (distance <= 12) return 4;
  return 5;
}

export function computeDifficultyScore(notesMidi: number[]): number {
  const compactness = scoreVoicingCompactness(notesMidi);
  const register = scoreVoicingRegister(notesMidi);
  return Math.max(1, Math.min(5, Math.round((compactness + register) / 2)));
}
