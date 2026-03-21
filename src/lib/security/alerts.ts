import { createAdminClient } from "@/lib/supabase/admin";

interface SecurityEventInput {
  eventType: string;
  severity?: "info" | "warning" | "critical";
  userId?: string | null;
  ip?: string | null;
  payload?: Record<string, unknown>;
}

export async function emitSecurityEvent(input: SecurityEventInput): Promise<void> {
  const severity = input.severity ?? "warning";
  const payload = input.payload ?? {};

  try {
    const admin = createAdminClient() as unknown as {
      from: (table: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error?: { message?: string } }>;
      };
    };
    const res = await admin.from("security_events").insert({
      event_type: input.eventType,
      severity,
      user_id: input.userId ?? null,
      ip: input.ip ?? null,
      payload,
    });
    if (res.error) {
      console.warn("[security-events] db insert failed", res.error.message);
    }
  } catch (error) {
    console.warn(
      "[security-events] emit failed",
      error instanceof Error ? error.message : "unknown",
    );
  }

  const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[${severity.toUpperCase()}] ${input.eventType}`,
        eventType: input.eventType,
        severity,
        userId: input.userId ?? null,
        ip: input.ip ?? null,
        payload,
        occurredAt: new Date().toISOString(),
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.warn(
      "[security-events] webhook failed",
      error instanceof Error ? error.message : "unknown",
    );
  }
}
