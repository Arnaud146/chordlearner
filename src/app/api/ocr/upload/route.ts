import { NextRequest, NextResponse } from "next/server";
import { apiError, handleApiError } from "@/lib/api/responses";
import { requireAuth } from "@/lib/api/require-auth";
import { createOCRRepository } from "@/lib/db/repositories/ocr.repository";
import { emitSecurityEvent } from "@/lib/security/alerts";
import { isOcrKillSwitchEnabled } from "@/lib/security/feature-flags";
import { consumeProductQuota, getQuotaConfig } from "@/lib/security/product-quotas";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const OCR_BUCKET = "ocr-imports";
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
const SIGNED_URL_TTL_SECONDS = 60 * 15; // 15 minutes
const OCR_UPLOAD_IP_LIMIT = 20;
const OCR_UPLOAD_USER_LIMIT = 40;
const OCR_UPLOAD_WINDOW_MS = 60 * 60 * 1000;

// Magic bytes for common image formats and PDF
const MAGIC_BYTES: Array<{ bytes: number[]; type: string }> = [
  { bytes: [0xff, 0xd8, 0xff], type: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47], type: "image/png" },
  { bytes: [0x47, 0x49, 0x46], type: "image/gif" },
  { bytes: [0x52, 0x49, 0x46, 0x46], type: "image/webp" }, // RIFF header
  { bytes: [0x25, 0x50, 0x44, 0x46], type: "application/pdf" }, // %PDF
];

function detectFileType(buffer: ArrayBuffer): string | null {
  const header = new Uint8Array(buffer.slice(0, 8));
  for (const magic of MAGIC_BYTES) {
    if (magic.bytes.every((byte, i) => header[i] === byte)) {
      return magic.type;
    }
  }
  return null;
}

function isPdfType(type: string): boolean {
  return type === "application/pdf";
}

function isImageType(type: string): boolean {
  return type.startsWith("image/");
}

export async function POST(request: NextRequest) {
  try {
    if (isOcrKillSwitchEnabled()) {
      return apiError("OCR temporarily disabled for maintenance/security.", 503);
    }

    const supabase = await createClient();
    const user = await requireAuth(supabase);
    const clientIp = getClientIp(request);

    const ipLimit = await consumeRateLimit({
      key: `ocr:upload:ip:${clientIp}`,
      limit: OCR_UPLOAD_IP_LIMIT,
      windowMs: OCR_UPLOAD_WINDOW_MS,
    });
    if (!ipLimit.allowed) {
      await emitSecurityEvent({
        eventType: "ocr_upload_rate_limited_ip",
        ip: clientIp,
        userId: user.id,
        payload: { used: ipLimit.used, limit: OCR_UPLOAD_IP_LIMIT },
      });
      return apiError("Too many OCR uploads from this IP. Please try again later.", 429);
    }

    const userLimit = await consumeRateLimit({
      key: `ocr:upload:user:${user.id}`,
      limit: OCR_UPLOAD_USER_LIMIT,
      windowMs: OCR_UPLOAD_WINDOW_MS,
    });
    if (!userLimit.allowed) {
      await emitSecurityEvent({
        eventType: "ocr_upload_rate_limited_user",
        ip: clientIp,
        userId: user.id,
        payload: { used: userLimit.used, limit: OCR_UPLOAD_USER_LIMIT },
      });
      return apiError("Hourly OCR upload quota reached. Please try again later.", 429);
    }

    const quotaConfig = getQuotaConfig("ocr_upload");
    const quota = await consumeProductQuota({
      userId: user.id,
      metric: "ocr_upload",
      dayLimit: quotaConfig.dayLimit,
      monthLimit: quotaConfig.monthLimit,
    });
    if (!quota.allowed) {
      await emitSecurityEvent({
        eventType: "ocr_upload_quota_exceeded",
        ip: clientIp,
        userId: user.id,
        payload: { reason: quota.reason, dayUsed: quota.dayUsed, monthUsed: quota.monthUsed },
      });
      return apiError("OCR quota reached (day/month).", 429);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const songId = formData.get("songId");

    if (!(file instanceof File)) {
      return apiError("Missing file (field: file)", 400);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return apiError(`File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)`, 413);
    }
    if (file.size === 0) {
      return apiError("The file is empty", 400);
    }

    // Validate file content via magic bytes
    const fileBuffer = await file.arrayBuffer();
    const detectedType = detectFileType(fileBuffer);
    if (!detectedType || (!isImageType(detectedType) && !isPdfType(detectedType))) {
      return apiError("Unrecognized file type. Only images and PDFs are accepted.", 400);
    }

    if (
      typeof songId === "string" &&
      songId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(songId)
    ) {
      return apiError("Invalid songId (UUID expected)", 400);
    }

    const extension = isPdfType(detectedType) ? "pdf" : detectedType.split("/")[1] ?? "jpg";
    const objectPath = `uploads/${crypto.randomUUID()}.${extension}`;

    const admin = createAdminClient();
    const uploadRes = await admin.storage
      .from(OCR_BUCKET)
      .upload(objectPath, fileBuffer, {
        upsert: false,
        contentType: detectedType,
      });

    if (uploadRes.error) {
      console.error("[ocr/upload] storage error", uploadRes.error.message);
      return apiError("Upload failed. Please try again later.", 500);
    }

    const signedUrlRes = await admin.storage
      .from(OCR_BUCKET)
      .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);
    if (signedUrlRes.error || !signedUrlRes.data?.signedUrl) {
      console.error(
        "[ocr/upload] signed url error",
        signedUrlRes.error?.message ?? "signed URL missing",
      );
      return apiError("Upload completed but signed URL unavailable. Please try again.", 500);
    }
    const imageUrl = signedUrlRes.data.signedUrl;

    const ocrRepository = createOCRRepository(supabase);
    const created = await ocrRepository.createOCRImport({
      song_id: typeof songId === "string" && songId ? songId : null,
      // Keep private storage path in DB; generate short-lived signed URLs per request.
      image_url: objectPath,
      ocr_provider: "none",
      ocr_raw_text: "",
      ocr_structured_tokens: [],
      review_status: "pending",
    });

    return NextResponse.json({
      data: {
        ocrImportId: created.id,
        imageUrl,
        reviewStatus: created.review_status,
      },
    });
  } catch (error) {
    return handleApiError(error, "Error during OCR upload");
  }
}
