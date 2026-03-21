import { NextRequest, NextResponse } from "next/server";
import { parseSongIdParam } from "@/lib/api/params";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { parseManualSchema } from "@/lib/api/schemas/song.schemas";
import { createChordRepository } from "@/lib/db/repositories/chord.repository";
import { createSongRepository } from "@/lib/db/repositories/song.repository";
import { parseManualAndPersistSong } from "@/lib/services/song-workflow.service";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ songId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const payload = parseManualSchema.parse(await request.json());
    const supabase = await createClient();
    await requireAuth(supabase);

    const songRepository = createSongRepository(supabase);
    const chordRepository = createChordRepository(supabase);

    const summary = await parseManualAndPersistSong({
      songId,
      rawText: payload.rawText,
      originalKey: payload.originalKey ?? null,
      notationPreference: payload.notationPreference,
      songRepository,
      chordRepository,
    });

    return NextResponse.json({
      data: {
        occurrenceCount: summary.occurrenceCount,
        uniqueChordCount: summary.uniqueChordCount,
        unknownChords: summary.unknownChords,
      },
    });
  } catch (error) {
    return handleApiError(error, "Impossible d'analyser la saisie manuelle");
  }
}
