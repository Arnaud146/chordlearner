import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiError, apiValidationError, handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { ocrDetectSchema } from "@/lib/api/schemas/ocr.schemas";
import { createOCRRepository } from "@/lib/db/repositories/ocr.repository";
import {
  postprocessOCRTokens,
  rebuildOCRResult,
  type OCRPostprocessResult,
} from "@/lib/domain/ocr/ocr-postprocess";
import { fuseProviderTokens } from "@/lib/domain/ocr/ocr-provider-fusion";
import {
  detectTextWithGoogleVision,
  detectTextWithOCRSpace,
  type OCRServiceResult,
} from "@/lib/services/ocr.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { emitSecurityEvent } from "@/lib/security/alerts";
import { isOcrKillSwitchEnabled } from "@/lib/security/feature-flags";
import { consumeProductQuota, getQuotaConfig } from "@/lib/security/product-quotas";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request-client";
import { createClient } from "@/lib/supabase/server";

type OCRProvider = "ocr.space" | "google.vision";
type RequestedProvider = OCRProvider | "auto.compare";

interface ProviderRunSummary {
  ok: boolean;
  recognizedChordCount?: number;
  lineCount?: number;
  error?: string;
}

interface ProviderOutcomeSuccess {
  ok: true;
  provider: OCRProvider;
  ocrResult: OCRServiceResult;
  postprocessed: OCRPostprocessResult;
  recognizedChordCount: number;
}

interface ProviderOutcomeFailure {
  ok: false;
  provider: OCRProvider;
  error: string;
}

type ProviderOutcome = ProviderOutcomeSuccess | ProviderOutcomeFailure;
const OCR_BUCKET = "ocr-imports";
const SIGNED_URL_TTL_SECONDS = 60 * 15; // 15 minutes
const OCR_DETECT_IP_LIMIT = 30;
const OCR_DETECT_USER_LIMIT = 80;
const OCR_DETECT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown OCR error";
}

function isRecoverableOCRInputError(message: string): boolean {
  return (
    message.includes("does not support PDF via URL") ||
    message.includes("cannot access the provided URL") ||
    message.includes("Bad image data") ||
    message.includes("returned no usable result") ||
    message.includes("No OCR provider worked")
  );
}

async function detectWithProvider(
  provider: OCRProvider,
  imageUrl: string,
): Promise<OCRServiceResult> {
  if (provider === "google.vision") {
    return detectTextWithGoogleVision(imageUrl);
  }
  return detectTextWithOCRSpace(imageUrl);
}

async function runProvider(params: {
  provider: OCRProvider;
  imageUrl: string;
  chordsOnly: boolean;
}): Promise<ProviderOutcome> {
  try {
    const ocrResult = await detectWithProvider(params.provider, params.imageUrl);
    const postprocessed = postprocessOCRTokens(ocrResult.tokens, {
      chordsOnly: params.chordsOnly,
    });
    const recognizedChordCount = postprocessed.tokens.filter(
      (token) => token.isChordRecognized,
    ).length;

    return {
      ok: true,
      provider: params.provider,
      ocrResult,
      postprocessed,
      recognizedChordCount,
    };
  } catch (error) {
    return {
      ok: false,
      provider: params.provider,
      error: getErrorMessage(error),
    };
  }
}

function pickBestOutcome(
  first: ProviderOutcomeSuccess,
  second: ProviderOutcomeSuccess,
): ProviderOutcomeSuccess {
  if (first.recognizedChordCount !== second.recognizedChordCount) {
    return first.recognizedChordCount > second.recognizedChordCount ? first : second;
  }
  if (first.postprocessed.lines.length !== second.postprocessed.lines.length) {
    return first.postprocessed.lines.length > second.postprocessed.lines.length
      ? first
      : second;
  }
  if (first.postprocessed.tokens.length !== second.postprocessed.tokens.length) {
    return first.postprocessed.tokens.length > second.postprocessed.tokens.length
      ? first
      : second;
  }
  return first.ocrResult.rawText.length >= second.ocrResult.rawText.length
    ? first
    : second;
}

function toRunSummary(outcome: ProviderOutcome): ProviderRunSummary {
  if (!outcome.ok) return { ok: false, error: outcome.error };
  return {
    ok: true,
    recognizedChordCount: outcome.recognizedChordCount,
    lineCount: outcome.postprocessed.lines.length,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (isOcrKillSwitchEnabled()) {
      return apiError("OCR temporarily disabled for maintenance/security.", 503);
    }

    const payload = ocrDetectSchema.parse(await request.json());
    const provider = payload.provider as RequestedProvider;
    const supabase = await createClient();
    const user = await requireAuth(supabase);
    const ocrRepository = createOCRRepository(supabase);
    const clientIp = getClientIp(request);

    const ipLimit = await consumeRateLimit({
      key: `ocr:detect:ip:${clientIp}`,
      limit: OCR_DETECT_IP_LIMIT,
      windowMs: OCR_DETECT_WINDOW_MS,
    });
    if (!ipLimit.allowed) {
      await emitSecurityEvent({
        eventType: "ocr_detect_rate_limited_ip",
        userId: user.id,
        ip: clientIp,
        payload: { used: ipLimit.used, limit: OCR_DETECT_IP_LIMIT },
      });
      return apiError("Too many OCR requests from this IP. Please try again later.", 429);
    }

    const userLimit = await consumeRateLimit({
      key: `ocr:detect:user:${user.id}`,
      limit: OCR_DETECT_USER_LIMIT,
      windowMs: OCR_DETECT_WINDOW_MS,
    });
    if (!userLimit.allowed) {
      await emitSecurityEvent({
        eventType: "ocr_detect_rate_limited_user",
        userId: user.id,
        ip: clientIp,
        payload: { used: userLimit.used, limit: OCR_DETECT_USER_LIMIT },
      });
      return apiError("Hourly OCR quota reached. Please try again later.", 429);
    }

    const quotaConfig = getQuotaConfig("ocr_detect");
    const quota = await consumeProductQuota({
      userId: user.id,
      metric: "ocr_detect",
      dayLimit: quotaConfig.dayLimit,
      monthLimit: quotaConfig.monthLimit,
    });
    if (!quota.allowed) {
      await emitSecurityEvent({
        eventType: "ocr_detect_quota_exceeded",
        userId: user.id,
        ip: clientIp,
        payload: { reason: quota.reason, dayUsed: quota.dayUsed, monthUsed: quota.monthUsed },
      });
      return apiError("OCR quota reached (day/month).", 429);
    }

    let imageUrl = payload.imageUrl ?? "";
    if (payload.ocrImportId) {
      const existing = await ocrRepository.getOCRImportById(payload.ocrImportId);
      const imageRef = existing.image_url;
      if (/^https?:\/\//i.test(imageRef)) {
        // Legacy rows may still store a direct URL.
        imageUrl = imageRef;
      } else {
        const admin = createAdminClient();
        const signed = await admin.storage
          .from(OCR_BUCKET)
          .createSignedUrl(imageRef, SIGNED_URL_TTL_SECONDS);
        if (signed.error || !signed.data?.signedUrl) {
          return apiError("Unable to sign the private OCR file.", 500);
        }
        imageUrl = signed.data.signedUrl;
      }
    }
    if (!imageUrl) {
      return apiError("imageUrl or ocrImportId required for OCR.", 400);
    }

    let providerUsed: OCRProvider;
    let ocrResult: OCRServiceResult;
    let postprocessed: OCRPostprocessResult;
    let comparison:
      | {
          mode: "auto.compare";
          selectedProvider: OCRProvider;
          ocrSpace: ProviderRunSummary;
          googleVision: ProviderRunSummary;
        }
      | undefined;

    if (provider === "auto.compare") {
      const [ocrSpaceOutcome, googleOutcome] = await Promise.all([
        runProvider({
          provider: "ocr.space",
          imageUrl,
          chordsOnly: payload.chordsOnly,
        }),
        runProvider({
          provider: "google.vision",
          imageUrl,
          chordsOnly: payload.chordsOnly,
        }),
      ]);

      if (!ocrSpaceOutcome.ok && !googleOutcome.ok) {
        throw new Error(
          `No OCR provider worked. OCR.space: ${ocrSpaceOutcome.error}. Google Vision: ${googleOutcome.error}.`,
        );
      }

      const bothOk = ocrSpaceOutcome.ok && googleOutcome.ok;
      const selected = bothOk
        ? pickBestOutcome(ocrSpaceOutcome, googleOutcome)
        : (ocrSpaceOutcome.ok ? ocrSpaceOutcome : googleOutcome) as ProviderOutcomeSuccess;

      providerUsed = selected.provider;
      ocrResult = selected.ocrResult;

      if (bothOk) {
        // Token-level fusion: upgrade chords the winning provider missed but the
        // other recognized, then rebuild the lines from the fused tokens.
        const donor =
          selected === ocrSpaceOutcome ? googleOutcome : ocrSpaceOutcome;
        const fusedTokens = fuseProviderTokens(
          selected.postprocessed.tokens,
          donor.postprocessed.tokens,
        );
        postprocessed = rebuildOCRResult(fusedTokens, {
          chordsOnly: payload.chordsOnly,
        });
      } else {
        postprocessed = selected.postprocessed;
      }

      comparison = {
        mode: "auto.compare",
        selectedProvider: selected.provider,
        ocrSpace: toRunSummary(ocrSpaceOutcome),
        googleVision: toRunSummary(googleOutcome),
      };
    } else {
      const outcome = await runProvider({
        provider,
        imageUrl,
        chordsOnly: payload.chordsOnly,
      });
      if (!outcome.ok) {
        throw new Error(outcome.error);
      }
      providerUsed = outcome.provider;
      ocrResult = outcome.ocrResult;
      postprocessed = outcome.postprocessed;
    }

    const persisted = payload.ocrImportId
      ? await ocrRepository.updateOCRImport(payload.ocrImportId, {
          song_id: payload.songId ?? null,
          ocr_provider: providerUsed,
          ocr_raw_text: ocrResult.rawText,
          ocr_structured_tokens: postprocessed.tokens,
          review_status: "pending",
        })
      : await ocrRepository.createOCRImport({
          song_id: payload.songId ?? null,
          image_url: imageUrl,
          ocr_provider: providerUsed,
          ocr_raw_text: ocrResult.rawText,
          ocr_structured_tokens: postprocessed.tokens,
          review_status: "pending",
        });

    return NextResponse.json({
      data: {
        ocrImportId: persisted.id,
        imageUrl: persisted.image_url,
        providerUsed,
        comparison,
        rawText: ocrResult.rawText,
        lines: postprocessed.lines,
        tokens: postprocessed.tokens,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) return apiValidationError(error);
    if (
      error instanceof Error &&
      (error.message.includes("OCR not configured") ||
        error.message.includes("Google Vision async PDF not configured"))
    ) {
      return apiError(error.message, 503);
    }
    if (error instanceof Error && isRecoverableOCRInputError(error.message)) {
      return apiError(error.message, 422);
    }
    return handleApiError(error, "OCR detect endpoint error");
  }
}
