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
    const uniqueChords = await chordRepository.getUniqueChordsBySong(songId);

    const ordered = [...uniqueChords].sort(
      (a, b) => b.occurrence_count - a.occurrence_count,
    );
    return NextResponse.json({ data: ordered });
  } catch (error) {
    return handleApiError(error, "Impossible de recuperer les accords uniques");
  }
}
