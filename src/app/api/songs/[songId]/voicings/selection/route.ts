import { NextRequest, NextResponse } from "next/server";
import { parseSongIdParam } from "@/lib/api/params";
import { apiError, handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import {
  voicingQuerySchema,
  voicingSelectionBodySchema,
} from "@/lib/api/schemas/voicing.schemas";
import {
  ensureVoicingOptionsForChord,
  pickDefaultVoicingOption,
} from "@/lib/api/voicings";
import { createVoicingRepository } from "@/lib/db/repositories/voicing.repository";
import { getOrCreateDefaultSelection } from "@/lib/services/voicing-selection.service";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ songId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const query = voicingQuerySchema.parse({
      chord: request.nextUrl.searchParams.get("chord"),
      keyContext: request.nextUrl.searchParams.get("keyContext"),
      handMode: request.nextUrl.searchParams.get("handMode") ?? "RH",
    });

    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createVoicingRepository(supabase);
    const options = await ensureVoicingOptionsForChord({
      supabase,
      songId,
      chord: query.chord,
      keyContext: query.keyContext,
      handMode: query.handMode,
    });
    const defaultOption = pickDefaultVoicingOption(options);

    if (!defaultOption) {
      return apiError("No voicing available for this chord", 400);
    }

    const fallbackSelection = await getOrCreateDefaultSelection({
      songId,
      keyContext: query.keyContext,
      chord: query.chord,
      handMode: query.handMode,
      repository: repo,
      defaultVoicingOptionId: defaultOption.id,
    });

    return NextResponse.json({
      data: {
        selection: fallbackSelection,
        defaultVoicingOptionId: defaultOption.id,
      },
    });
  } catch (error) {
    return handleApiError(error, "Unable to load the voicing selection");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const songId = await parseSongIdParam(context.params);
    const payload = voicingSelectionBodySchema.parse(await request.json());
    const supabase = await createClient();
    await requireAuth(supabase);
    const repo = createVoicingRepository(supabase);

    const options = await ensureVoicingOptionsForChord({
      supabase,
      songId,
      chord: payload.chord,
      keyContext: payload.keyContext,
      handMode: payload.handMode,
    });
    const selectedExists = options.some(
      (option) => option.id === payload.selectedVoicingOptionId,
    );
    if (!selectedExists) {
      return apiError("The selected voicing is invalid", 400);
    }

    const savedSelection = await repo.upsertUserVoicingSelection({
      song_id: songId,
      key_context: payload.keyContext,
      normalized_chord_symbol: payload.chord,
      hand_mode: payload.handMode,
      selected_voicing_option_id: payload.selectedVoicingOptionId,
      selection_source: "user_selected",
    });

    return NextResponse.json({ data: savedSelection });
  } catch (error) {
    return handleApiError(error, "Unable to save the voicing selection");
  }
}
