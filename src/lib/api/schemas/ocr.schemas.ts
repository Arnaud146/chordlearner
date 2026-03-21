import { z } from "zod";
import { assertSafeUrl } from "@/lib/security/safe-url";

const safeUrlSchema = z.string().url("imageUrl invalide").refine(
  (url) => {
    try {
      assertSafeUrl(url);
      return true;
    } catch {
      return false;
    }
  },
  { message: "URL cible non autorisee" },
);

export const ocrDetectSchema = z.object({
  ocrImportId: z.string().uuid("ocrImportId invalide").optional().nullable(),
  imageUrl: safeUrlSchema.optional(),
  songId: z.string().uuid("songId invalide").optional(),
  provider: z
    .enum(["ocr.space", "google.vision", "auto.compare"])
    .optional()
    .default("ocr.space"),
  chordsOnly: z.boolean().optional().default(false),
});

export const ocrFinalizeSchema = z.object({
  ocrImportId: z.string().uuid("ocrImportId invalide").optional().nullable(),
  songId: z.string().uuid("songId invalide").optional().nullable(),
  title: z.string().trim().min(1, "Le titre est requis"),
  artist: z.string().trim().min(1).optional().nullable(),
  originalKey: z.string().trim().min(1).optional().nullable(),
  sourceType: z.enum(["ocr_image", "web_page"]).default("ocr_image"),
  notationPreference: z
    .enum(["auto", "sharps", "flats"])
    .default("auto"),
  validatedText: z.string().trim().min(1, "Le texte validé est requis"),
  reviewStatus: z.enum(["pending", "validated", "discarded"]).default("validated"),
});
