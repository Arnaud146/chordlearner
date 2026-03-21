import { NextRequest, NextResponse } from "next/server";
import { parseSongIdParam } from "@/lib/api/params";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { createChordRepository } from "@/lib/db/repositories/chord.repository";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ songId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const supabase = await createClient();
    await requireAuth(supabase);
    const chordRepository = createChordRepository(supabase);
    const occurrences = await chordRepository.getChordOccurrencesBySong(songId);

    return NextResponse.json({ data: occurrences });
  } catch (error) {
    return handleApiError(error, "Impossible de recuperer les occurrences d'accords");
  }
}
