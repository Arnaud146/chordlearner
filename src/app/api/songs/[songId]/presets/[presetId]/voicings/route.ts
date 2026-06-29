import { NextRequest, NextResponse } from "next/server";
import { parseSongAndPresetIdParams } from "@/lib/api/params";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { presetVoicingBodySchema } from "@/lib/api/schemas/preset.schemas";
import { createPresetRepository } from "@/lib/db/repositories/preset.repository";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ songId: string; presetId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { presetId } = await parseSongAndPresetIdParams(context.params);
    const body = presetVoicingBodySchema.parse(await request.json());
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createPresetRepository(supabase);

    const selection = await repo.upsertPresetVoicingSelection({
      preset_id: presetId,
      normalized_chord_symbol: body.chord,
      selected_voicing_option_id: body.selectedVoicingOptionId,
    });

    return NextResponse.json({ data: selection });
  } catch (error) {
    return handleApiError(error, "Unable to save the preset voicing selection");
  }
}
