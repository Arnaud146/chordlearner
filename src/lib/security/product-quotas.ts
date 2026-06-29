import { createAdminClient } from "@/lib/supabase/admin";

export type QuotaMetric =
  | "ocr_upload"
  | "ocr_detect"
  | "chord_extraction"
  | "account_creation";

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: "daily_limit" | "monthly_limit" | "unknown";
  dayUsed?: number;
  monthUsed?: number;
}

function envLimit(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getQuotaConfig(metric: QuotaMetric): { dayLimit: number; monthLimit: number } {
  switch (metric) {
    case "ocr_upload":
      return {
        dayLimit: envLimit("QUOTA_OCR_UPLOAD_DAY", 40),
        monthLimit: envLimit("QUOTA_OCR_UPLOAD_MONTH", 600),
      };
    case "ocr_detect":
      return {
        dayLimit: envLimit("QUOTA_OCR_DETECT_DAY", 80),
        monthLimit: envLimit("QUOTA_OCR_DETECT_MONTH", 1200),
      };
    case "chord_extraction":
      return {
        dayLimit: envLimit("QUOTA_CHORD_EXTRACTION_DAY", 100),
        monthLimit: envLimit("QUOTA_CHORD_EXTRACTION_MONTH", 2000),
      };
    case "account_creation":
      return {
        dayLimit: envLimit("QUOTA_ACCOUNT_CREATION_DAY", 3),
        monthLimit: envLimit("QUOTA_ACCOUNT_CREATION_MONTH", 10),
      };
    default:
      return { dayLimit: 50, monthLimit: 1000 };
  }
}

export async function consumeProductQuota(params: {
  userId: string;
  metric: QuotaMetric;
  dayLimit: number;
  monthLimit: number;
}): Promise<QuotaCheckResult> {
  try {
    const admin = createAdminClient() as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data?: Array<Record<string, unknown>>; error?: { message?: string } }>;
    };
    const res = await admin.rpc("consume_product_quota", {
      p_user_id: params.userId,
      p_metric: params.metric,
      p_day_limit: params.dayLimit,
      p_month_limit: params.monthLimit,
    });
    if (res.error || !res.data?.[0]) {
      console.error(
        "[product-quotas] RPC error — is the consume_product_quota function deployed?",
        res.error?.message ?? "no data",
      );
      return { allowed: false, reason: "unknown" };
    }
    const row = res.data[0];
    const allowed = Boolean(row.allowed);
    const reasonRaw = String(row.reason ?? "");
    const reason =
      reasonRaw === "daily_limit" || reasonRaw === "monthly_limit"
        ? reasonRaw
        : "unknown";
    return {
      allowed,
      reason: allowed ? undefined : reason,
      dayUsed: Number(row.day_used ?? 0),
      monthUsed: Number(row.month_used ?? 0),
    };
  } catch (error) {
    console.error(
      "[product-quotas] quota check failed — is the consume_product_quota function deployed?",
      error instanceof Error ? error.message : "unknown",
    );
    return { allowed: false, reason: "unknown" };
  }
}
