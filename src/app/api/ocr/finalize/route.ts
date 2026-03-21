import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { ocrFinalizeSchema } from "@/lib/api/schemas/ocr.schemas";
import { createChordRepository } from "@/lib/db/repositories/chord.repository";
import { createOCRRepository } from "@/lib/db/repositories/ocr.repository";
import { createPresetRepository } from "@/lib/db/repositories/preset.repository";
import { createSongRepository } from "@/lib/db/repositories/song.repository";
import { finalizeOCRToSong } from "@/lib/services/ocr-finalize.service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const payload = ocrFinalizeSchema.parse(await request.json());
    const supabase = await createClient();
    await requireAuth(supabase);
    const songRepository = createSongRepository(supabase);
    const chordRepository = createChordRepository(supabase);
    const ocrRepository = createOCRRepository(supabase);
    const presetRepository = createPresetRepository(supabase);

    const result = await finalizeOCRToSong(
      {
        title: payload.title,
        artist: payload.artist ?? null,
        originalKey: payload.originalKey ?? null,
        sourceType: payload.sourceType,
        notationPreference: payload.notationPreference,
        validatedText: payload.validatedText,
        ocrImportId: payload.ocrImportId ?? null,
        reviewStatus: payload.reviewStatus,
      },
      {
        songRepository,
        chordRepository,
        ocrRepository,
        presetRepository,
      },
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error, "Erreur endpoint OCR finalize");
  }
}
