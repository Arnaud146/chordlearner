import { z } from "zod";

export const createPresetBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  keySnapshot: z.string().trim().min(1, "keySnapshot is required"),
  notationSnapshot: z.enum(["auto", "sharps", "flats"]).default("auto"),
});

export const updatePresetBodySchema = z.object({
  name: z.string().trim().min(1, "The name cannot be empty"),
});

export const presetVoicingBodySchema = z.object({
  chord: z.string().trim().min(1, "The chord parameter is required"),
  selectedVoicingOptionId: z.string().uuid("Invalid selectedVoicingOptionId"),
});
