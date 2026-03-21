import { NextRequest, NextResponse } from "next/server";
import { parseSongIdParam } from "@/lib/api/params";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { updateSongSchema } from "@/lib/api/schemas/song.schemas";
import { createSongRepository } from "@/lib/db/repositories/song.repository";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ songId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createSongRepository(supabase);
    const song = await repo.getSongById(songId);
    return NextResponse.json({ data: song });
  } catch (error) {
    return handleApiError(error, "Chanson introuvable", 404);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const payload = updateSongSchema.parse(await request.json());
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createSongRepository(supabase);

    const updated = await repo.updateSong(songId, {
      title: payload.title,
      artist: payload.artist,
      original_key: payload.originalKey,
      current_key: payload.currentKey,
      notation_preference: payload.notationPreference,
      raw_text: payload.rawText,
      normalized_text: payload.normalizedText,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error, "Impossible de mettre a jour la chanson");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createSongRepository(supabase);
    await repo.deleteSong(songId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "Impossible de supprimer la chanson");
  }
}
