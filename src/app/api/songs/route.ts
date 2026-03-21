import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { createSongSchema } from "@/lib/api/schemas/song.schemas";
import { createPresetRepository } from "@/lib/db/repositories/preset.repository";
import { createSongRepository } from "@/lib/db/repositories/song.repository";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createSongRepository(supabase);
    const songs = await repo.listSongs();
    return NextResponse.json({ data: songs });
  } catch (error) {
    return handleApiError(error, "Impossible de lister les chansons");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = createSongSchema.parse(await request.json());

    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createSongRepository(supabase);
    const presetRepo = createPresetRepository(supabase);

    const created = await repo.createSong({
      title: payload.title,
      artist: payload.artist ?? null,
      source_type: payload.sourceType,
      original_key: payload.originalKey ?? null,
      current_key: payload.originalKey ?? null,
      notation_preference: payload.notationPreference,
      raw_text: "",
      normalized_text: null,
    });

    await presetRepo.createPreset({
      song_id: created.id,
      name: "Plan de jeu 1",
      key_snapshot: created.current_key ?? created.original_key ?? "C",
      notation_snapshot: created.notation_preference,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Impossible de creer la chanson");
  }
}
