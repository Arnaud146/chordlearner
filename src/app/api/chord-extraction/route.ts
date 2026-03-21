import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { chordExtractionSchema } from "@/lib/api/schemas/chord-extraction.schemas";
import { apiValidationError, handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import {
  detectSourceKind,
  shouldFallbackToOcr,
  shouldUseWebExtraction,
} from "@/lib/chords/fallback-strategy";
import { fetchPage, FetchPageError } from "@/lib/chords/fetch-page";
import { parseSongFromHtml } from "@/lib/chords/parse-song-from-html";
import { createSongExtractionRepository } from "@/lib/db/repositories/song-extraction.repository";
import { emitSecurityEvent } from "@/lib/security/alerts";
import { consumeProductQuota, getQuotaConfig } from "@/lib/security/product-quotas";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request-client";
import { createClient } from "@/lib/supabase/server";
import type { ChordExtractionResult, ExtractionMode } from "@/types/chords";

const CHORD_EXTRACTION_IP_LIMIT = 60;
const CHORD_EXTRACTION_USER_LIMIT = 120;
const CHORD_EXTRACTION_WINDOW_MS = 60 * 60 * 1000;

function fallbackModeFromPreference(preferredMode: ExtractionMode): ExtractionMode {
  return preferredMode === "manual" ? "manual" : "ocr";
}

export async function POST(request: NextRequest) {
  try {
    const payload = chordExtractionSchema.parse(await request.json());
    const supabase = await createClient();
    const user = await requireAuth(supabase);
    const clientIp = getClientIp(request);

    const ipLimit = await consumeRateLimit({
      key: `chord-extraction:ip:${clientIp}`,
      limit: CHORD_EXTRACTION_IP_LIMIT,
      windowMs: CHORD_EXTRACTION_WINDOW_MS,
    });
    if (!ipLimit.allowed) {
      await emitSecurityEvent({
        eventType: "chord_extraction_rate_limited_ip",
        userId: user.id,
        ip: clientIp,
        payload: { used: ipLimit.used, limit: CHORD_EXTRACTION_IP_LIMIT },
      });
      return NextResponse.json(
        { error: "Trop de requetes d'extraction depuis cette IP. Reessayez plus tard." },
        { status: 429 },
      );
    }

    const userLimit = await consumeRateLimit({
      key: `chord-extraction:user:${user.id}`,
      limit: CHORD_EXTRACTION_USER_LIMIT,
      windowMs: CHORD_EXTRACTION_WINDOW_MS,
    });
    if (!userLimit.allowed) {
      await emitSecurityEvent({
        eventType: "chord_extraction_rate_limited_user",
        userId: user.id,
        ip: clientIp,
        payload: { used: userLimit.used, limit: CHORD_EXTRACTION_USER_LIMIT },
      });
      return NextResponse.json(
        { error: "Quota horaire d'extraction atteint. Reessayez plus tard." },
        { status: 429 },
      );
    }

    const quotaConfig = getQuotaConfig("chord_extraction");
    const quota = await consumeProductQuota({
      userId: user.id,
      metric: "chord_extraction",
      dayLimit: quotaConfig.dayLimit,
      monthLimit: quotaConfig.monthLimit,
    });
    if (!quota.allowed) {
      await emitSecurityEvent({
        eventType: "chord_extraction_quota_exceeded",
        userId: user.id,
        ip: clientIp,
        payload: { reason: quota.reason, dayUsed: quota.dayUsed, monthUsed: quota.monthUsed },
      });
      return NextResponse.json({ error: "Quota extraction atteint (jour/mois)." }, { status: 429 });
    }

    const preferredMode = payload.preferredMode;

    let sourceKind = detectSourceKind({ url: payload.url });
    console.info("[chord-extraction] request received", {
      url: payload.url,
      preferredMode,
      sourceKind,
    });

    if (!shouldUseWebExtraction({ sourceKind, preferredMode })) {
      const mode = fallbackModeFromPreference(preferredMode);
      const result: ChordExtractionResult = {
        success: false,
        mode,
        fallbackUsed: mode === "ocr",
        message:
          mode === "ocr"
            ? "Source non HTML detectee. Utilisez le mode OCR."
            : "Mode manuel force par preference utilisateur.",
        debug: {
          sourceKind,
          selectedExtractor: "none",
          candidateBlocks: [],
          rawLines: [],
        },
      };

      return NextResponse.json({ data: result });
    }

    try {
      const fetched = await fetchPage(payload.url);
      sourceKind = detectSourceKind({
        url: fetched.finalUrl,
        contentType: fetched.contentType,
      });

      if (!shouldUseWebExtraction({ sourceKind, preferredMode })) {
        const mode = fallbackModeFromPreference(preferredMode);
        const result: ChordExtractionResult = {
          success: false,
          mode,
          fallbackUsed: mode === "ocr",
          message:
            mode === "ocr"
              ? "Le lien pointe vers un PDF/image. Utilisez OCR."
              : "Mode manuel force par preference utilisateur.",
          debug: {
            sourceKind,
            selectedExtractor: "none",
            candidateBlocks: [],
            rawLines: [],
          },
        };

        if (payload.persistResult) {
          const extractionRepository = createSongExtractionRepository(supabase);
          await extractionRepository.createSongExtraction({
            song_id: payload.sourceSongId ?? null,
            source_url: payload.url,
            source_type: sourceKind,
            mode: mode === "manual" ? "manual" : "ocr",
            status: "fallback",
            error_message: "Source non HTML, fallback OCR requis",
          });
        }

        return NextResponse.json({ data: result });
      }

      const parsed = parseSongFromHtml({
        sourceUrl: fetched.finalUrl,
        html: fetched.html,
      });

      const result: ChordExtractionResult = {
        success: true,
        mode: "web",
        fallbackUsed: false,
        message: "Extraction web reussie.",
        song: parsed.song,
        debug: parsed.debug,
      };

      if (payload.persistResult) {
        const supabase = await createClient();
        const extractionRepository = createSongExtractionRepository(supabase);
        const rawText = parsed.song.sections
          .flatMap((section) =>
            section.lines.flatMap((line) => {
              if (line.kind === "lyrics_with_chords") {
                return [line.rawChords ?? line.chords.join(" "), line.rawLyrics ?? line.raw];
              }
              if (line.kind === "lyrics_only") {
                return [line.lyrics ?? line.raw];
              }
              return [line.raw];
            }),
          )
          .join("\n")
          .trim();

        await extractionRepository.createSongExtraction({
          song_id: payload.sourceSongId ?? null,
          source_url: fetched.finalUrl,
          source_type: sourceKind,
          mode: "web",
          title: parsed.song.title,
          raw_text: rawText,
          structured_json: parsed.song as unknown as Record<string, unknown>,
          unique_chords: parsed.song.allChords,
          status: "analyzed",
        });
      }

      return NextResponse.json({ data: result });
    } catch (error) {
      const fallbackUsed = shouldFallbackToOcr({
        sourceKind,
        preferredMode,
        webSucceeded: false,
      });
      const mode = fallbackUsed ? "ocr" : fallbackModeFromPreference(preferredMode);
      const message =
        mode === "ocr"
          ? "Extraction web en echec. Passez au mode OCR."
          : "Extraction web en echec. Passez au mode manuel.";

      console.warn("[chord-extraction] web extraction failed", {
        url: payload.url,
        sourceKind,
        error: error instanceof Error ? error.message : "unknown",
      });

      // Sanitize: only expose FetchPageError messages, not raw internal errors
      const errorMessage =
        error instanceof FetchPageError
          ? error.message
          : "Erreur pendant l'extraction web.";

      if (payload.persistResult) {
        const supabase = await createClient();
        const extractionRepository = createSongExtractionRepository(supabase);
        await extractionRepository.createSongExtraction({
          song_id: payload.sourceSongId ?? null,
          source_url: payload.url,
          source_type: sourceKind,
          mode: mode === "manual" ? "manual" : "ocr",
          status: fallbackUsed ? "fallback" : "error",
          error_message: errorMessage,
        });
      }

      const result: ChordExtractionResult = {
        success: false,
        mode,
        fallbackUsed,
        message,
        error: errorMessage,
        debug: {
          sourceKind,
          selectedExtractor: "generic-html-extractor",
          candidateBlocks: [],
          rawLines: [],
        },
      };

      return NextResponse.json({ data: result });
    }
  } catch (error) {
    if (error instanceof ZodError) return apiValidationError(error);
    return handleApiError(error, "Erreur endpoint chord extraction");
  }
}
