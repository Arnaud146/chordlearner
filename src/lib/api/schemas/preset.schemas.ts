import { z } from "zod";

export const createPresetBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  keySnapshot: z.string().trim().min(1, "keySnapshot est requis"),
  notationSnapshot: z.enum(["auto", "sharps", "flats"]).default("auto"),
});

export const updatePresetBodySchema = z.object({
  name: z.string().trim().min(1, "Le nom ne peut pas être vide"),
});

export const presetVoicingBodySchema = z.object({
  chord: z.string().trim().min(1, "Le paramètre chord est requis"),
  selectedVoicingOptionId: z.string().uuid("selectedVoicingOptionId invalide"),
});

export type CreatePresetBodyInput = z.infer<typeof createPresetBodySchema>;
export type UpdatePresetBodyInput = z.infer<typeof updatePresetBodySchema>;
export type PresetVoicingBodyInput = z.infer<typeof presetVoicingBodySchema>;
