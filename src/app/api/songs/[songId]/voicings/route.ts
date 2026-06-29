import { NextRequest, NextResponse } from "next/server";
import { parseSongIdParam } from "@/lib/api/params";
import { handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { voicingQuerySchema } from "@/lib/api/schemas/voicing.schemas";
import {
  ensureVoicingOptionsForChord,
  pickDefaultVoicingOption,
} from "@/lib/api/voicings";
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
    const options = await ensureVoicingOptionsForChord({
      supabase,
      songId,
      chord: query.chord,
      keyContext: query.keyContext,
      handMode: query.handMode,
    });
    const defaultOption = pickDefaultVoicingOption(options);

    return NextResponse.json({
      data: {
        options,
        defaultVoicingOptionId: defaultOption?.id ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error, "Unable to load the voicings");
  }
}
