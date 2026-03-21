import type { NotationPreference } from "@/lib/types/db";

const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"]);

export function resolveEffectiveNotationPreference(params: {
  notationPreference: NotationPreference;
  targetKey: string;
}): "sharps" | "flats" {
  if (params.notationPreference === "sharps") return "sharps";
  if (params.notationPreference === "flats") return "flats";
  return FLAT_KEYS.has(params.targetKey) ? "flats" : "sharps";
}
