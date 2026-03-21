import { NextRequest, NextResponse } from "next/server";
import { parseSongIdParam } from "@/lib/api/params";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { transposeSongSchema } from "@/lib/api/schemas/song.schemas";
import { createSongRepository } from "@/lib/db/repositories/song.repository";
import { transposeSongState } from "@/lib/services/song-workflow.service";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ songId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const payload = transposeSongSchema.parse(await request.json());
    const supabase = await createClient();
    await requireAuth(supabase);
    const songRepository = createSongRepository(supabase);
    const result = await transposeSongState({
      songId,
      toKey: payload.toKey,
      notationPreference: payload.notationPreference,
      songRepository,
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return handleApiError(error, "Impossible de transposer le morceau");
  }
}
