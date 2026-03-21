import { NextRequest, NextResponse } from "next/server";
import { parseSongAndPresetIdParams } from "@/lib/api/params";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { updatePresetBodySchema } from "@/lib/api/schemas/preset.schemas";
import { createPresetRepository } from "@/lib/db/repositories/preset.repository";
import { createClient } from "@/lib/supabase/server";
import type { ChordVoicingOptionRow } from "@/lib/types/db";
import { assertSupabaseData } from "@/lib/db/helpers";

interface RouteContext {
  params: Promise<{ songId: string; presetId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { presetId } = await parseSongAndPresetIdParams(context.params);
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createPresetRepository(supabase);

    const preset = await repo.getPresetById(presetId);
    const selections = await repo.listPresetVoicingSelections(presetId);

    const voicingOptionIds = selections.map((s) => s.selected_voicing_option_id);
    let voicingOptions: ChordVoicingOptionRow[] = [];
    if (voicingOptionIds.length > 0) {
      const res = await supabase
        .from("chord_voicing_options")
        .select("*")
        .in("id", voicingOptionIds);
      voicingOptions = assertSupabaseData(res);
    }

    const voicingMap = new Map(voicingOptions.map((v) => [v.id, v]));
    const selectionsWithVoicing = selections.map((sel) => ({
      ...sel,
      voicing: voicingMap.get(sel.selected_voicing_option_id) ?? null,
    }));

    return NextResponse.json({
      data: { preset, selections: selectionsWithVoicing },
    });
  } catch (error) {
    return handleApiError(error, "Impossible de charger le preset");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { presetId } = await parseSongAndPresetIdParams(context.params);
    const body = updatePresetBodySchema.parse(await request.json());
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createPresetRepository(supabase);
    const updated = await repo.updatePreset(presetId, { name: body.name });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error, "Impossible de renommer le preset");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { presetId } = await parseSongAndPresetIdParams(context.params);
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createPresetRepository(supabase);
    await repo.deletePreset(presetId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error, "Impossible de supprimer le preset");
  }
}
