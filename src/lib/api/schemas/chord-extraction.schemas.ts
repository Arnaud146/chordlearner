import { z } from "zod";

export const chordExtractionSchema = z.object({
  url: z.string().trim().url("URL invalide"),
  sourceSongId: z.string().uuid("sourceSongId invalide").optional().nullable(),
  preferredMode: z.enum(["web", "ocr", "manual"]).default("web"),
  persistResult: z.boolean().default(true),
});

export type ChordExtractionInput = z.infer<typeof chordExtractionSchema>;
