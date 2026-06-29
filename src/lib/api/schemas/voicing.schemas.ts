import { z } from "zod";

const voicingHandModeSchema = z.enum(["RH", "BH"]);

export const voicingQuerySchema = z.object({
  chord: z.string().trim().min(1, "The chord parameter is required"),
  keyContext: z.string().trim().min(1, "The keyContext parameter is required"),
  handMode: voicingHandModeSchema.default("RH"),
});

export const voicingSelectionBodySchema = z.object({
  chord: z.string().trim().min(1),
  keyContext: z.string().trim().min(1),
  handMode: voicingHandModeSchema.default("RH"),
  selectedVoicingOptionId: z.string().uuid("Invalid selectedVoicingOptionId"),
});
