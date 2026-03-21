export interface FingeringSuggestion {
  rightHand: number[];
}

export function suggestRightHandFingering(notesMidi: number[]): FingeringSuggestion {
  const count = notesMidi.length;
  if (count <= 1) return { rightHand: [1] };
  if (count === 2) return { rightHand: [1, 3] };
  if (count === 3) return { rightHand: [1, 3, 5] };
  if (count === 4) return { rightHand: [1, 2, 4, 5] };
  if (count === 5) return { rightHand: [1, 2, 3, 4, 5] };
  return { rightHand: [1, 2, 3, 4, 5] };
}
