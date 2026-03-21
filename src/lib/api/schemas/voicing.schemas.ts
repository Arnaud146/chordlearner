import { z } from "zod";

export const voicingHandModeSchema = z.enum(["RH", "BH"]);

export const voicingQuerySchema = z.object({
  chord: z.string().trim().min(1, "Le paramètre chord est requis"),
  keyContext: z.string().trim().min(1, "Le paramètre keyContext est requis"),
  handMode: voicingHandModeSchema.default("RH"),
});

export const voicingSelectionBodySchema = z.object({
  chord: z.string().trim().min(1),
  keyContext: z.string().trim().min(1),
  handMode: voicingHandModeSchema.default("RH"),
  selectedVoicingOptionId: z.string().uuid("selectedVoicingOptionId invalide"),
});

export type VoicingQueryInput = z.infer<typeof voicingQuerySchema>;
export type VoicingSelectionBodyInput = z.infer<typeof voicingSelectionBodySchema>;
