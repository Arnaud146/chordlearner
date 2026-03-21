import { z } from "zod";

export const notationPreferenceSchema = z.enum(["auto", "sharps", "flats"]);

export const createSongSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  artist: z.string().trim().min(1).optional().nullable(),
  originalKey: z.string().trim().min(1).optional().nullable(),
  sourceType: z.enum(["manual", "ocr_image", "web_page"]).default("manual"),
  notationPreference: notationPreferenceSchema.default("auto"),
});

export const updateSongSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    artist: z.string().trim().min(1).nullable().optional(),
    originalKey: z.string().trim().min(1).nullable().optional(),
    currentKey: z.string().trim().min(1).nullable().optional(),
    notationPreference: notationPreferenceSchema.optional(),
    rawText: z.string().optional(),
    normalizedText: z.string().nullable().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const parseManualSchema = z.object({
  rawText: z.string().default(""),
  originalKey: z.string().trim().min(1).optional().nullable(),
  notationPreference: notationPreferenceSchema.default("auto"),
});

export const transposeSongSchema = z.object({
  toKey: z.enum(["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]),
  notationPreference: notationPreferenceSchema.default("auto"),
});

export type CreateSongInput = z.infer<typeof createSongSchema>;
export type UpdateSongInput = z.infer<typeof updateSongSchema>;
export type ParseManualInput = z.infer<typeof parseManualSchema>;
export type TransposeSongInput = z.infer<typeof transposeSongSchema>;
