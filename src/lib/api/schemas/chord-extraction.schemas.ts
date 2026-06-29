import { z } from "zod";

export const chordExtractionSchema = z.object({
  url: z.string().trim().url("Invalid URL"),
  sourceSongId: z.string().uuid("Invalid sourceSongId").optional().nullable(),
  preferredMode: z.enum(["web", "ocr", "manual"]).default("web"),
  persistResult: z.boolean().default(true),
});
