import { NextRequest, NextResponse } from "next/server";
import { parseSongIdParam } from "@/lib/api/params";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { createPresetBodySchema } from "@/lib/api/schemas/preset.schemas";
import { createPresetRepository } from "@/lib/db/repositories/preset.repository";
import { createVoicingRepository } from "@/lib/db/repositories/voicing.repository";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ songId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createPresetRepository(supabase);
    const presets = await repo.listPresetsForSong(songId);
    return NextResponse.json({ data: presets });
  } catch (error) {
    return handleApiError(error, "Impossible de charger les presets");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const body = createPresetBodySchema.parse(await request.json());

    const supabase = await createClient();
    await requireAuth(supabase);
    const presetRepo = createPresetRepository(supabase);
    const voicingRepo = createVoicingRepository(supabase);

    const existingPresets = await presetRepo.listPresetsForSong(songId);
    const presetName = body.name ?? `Plan de jeu ${existingPresets.length + 1}`;

    const preset = await presetRepo.createPreset({
      song_id: songId,
      name: presetName,
      key_snapshot: body.keySnapshot,
      notation_snapshot: body.notationSnapshot,
    });

    const currentSelections = await voicingRepo.listUserVoicingSelectionsForSong(
      songId,
      body.keySnapshot,
    );

    if (currentSelections.length > 0) {
      await presetRepo.bulkInsertPresetVoicingSelections(
        currentSelections.map((sel) => ({
          preset_id: preset.id,
          normalized_chord_symbol: sel.normalized_chord_symbol,
          selected_voicing_option_id: sel.selected_voicing_option_id,
        })),
      );
    }

    return NextResponse.json({ data: preset }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Impossible de creer le preset");
  }
}
