import { z } from "zod";
import { assertSafeUrl } from "@/lib/security/safe-url";

const safeUrlSchema = z.string().url("Invalid imageUrl").refine(
  (url) => {
    try {
      assertSafeUrl(url);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Target URL not allowed" },
);

export const ocrDetectSchema = z.object({
  ocrImportId: z.string().uuid("Invalid ocrImportId").optional().nullable(),
  imageUrl: safeUrlSchema.optional(),
  songId: z.string().uuid("Invalid songId").optional(),
  provider: z
    .enum(["ocr.space", "google.vision", "auto.compare"])
    .optional()
    .default("ocr.space"),
  chordsOnly: z.boolean().optional().default(false),
});

export const ocrFinalizeSchema = z.object({
  ocrImportId: z.string().uuid("Invalid ocrImportId").optional().nullable(),
  songId: z.string().uuid("Invalid songId").optional().nullable(),
  title: z.string().trim().min(1, "Title is required"),
  artist: z.string().trim().min(1).optional().nullable(),
  originalKey: z.string().trim().min(1).optional().nullable(),
  sourceType: z.enum(["ocr_image", "web_page"]).default("ocr_image"),
  notationPreference: z
    .enum(["auto", "sharps", "flats"])
    .default("auto"),
  validatedText: z.string().trim().min(1, "Validated text is required"),
  reviewStatus: z.enum(["pending", "validated", "discarded"]).default("validated"),
});
