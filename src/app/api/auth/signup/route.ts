import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api/responses";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { emitSecurityEvent } from "@/lib/security/alerts";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request-client";
import { createClient } from "@/lib/supabase/server";

const signupSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z
    .string()
    .min(10, "Password too short (10 characters min)")
    .max(128, "Password too long"),
  nextPath: z.string().optional(),
});

const SIGNUP_IP_LIMIT = 10; // attempts
const SIGNUP_IP_WINDOW_MS = 15 * 60 * 1000; // 15 min
const SIGNUP_EMAIL_LIMIT = 4; // attempts
const SIGNUP_EMAIL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function buildEmailRedirectUrl(request: NextRequest, nextPath: string): string {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/callback";
  url.search = "";
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export async function POST(request: NextRequest) {
  try {
    const payload = signupSchema.parse(await request.json());
    const email = payload.email.toLowerCase();
    const nextPath = sanitizeRedirectPath(payload.nextPath);
    const clientIp = getClientIp(request);

    const ipLimit = await consumeRateLimit({
      key: `signup:ip:${clientIp}`,
      limit: SIGNUP_IP_LIMIT,
      windowMs: SIGNUP_IP_WINDOW_MS,
    });
    if (!ipLimit.allowed) {
      await emitSecurityEvent({
        eventType: "signup_rate_limited_ip",
        severity: "warning",
        ip: clientIp,
        payload: { used: ipLimit.used, limit: SIGNUP_IP_LIMIT },
      });
      return apiError("Too many attempts. Please try again later.", 429);
    }

    const emailLimit = await consumeRateLimit({
      key: `signup:email:${email}`,
      limit: SIGNUP_EMAIL_LIMIT,
      windowMs: SIGNUP_EMAIL_WINDOW_MS,
    });
    if (!emailLimit.allowed) {
      await emitSecurityEvent({
        eventType: "signup_rate_limited_email",
        severity: "warning",
        ip: clientIp,
        payload: { email, used: emailLimit.used, limit: SIGNUP_EMAIL_LIMIT },
      });
      return apiError("Too many attempts for this email. Please try again later.", 429);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: payload.password,
      options: {
        emailRedirectTo: buildEmailRedirectUrl(request, nextPath),
      },
    });
    if (error) {
      const msg = error.message;
      if (msg === "User already registered") {
        return apiError("An account already exists with this email.", 409);
      }
      return apiError("Sign-up is not possible right now.", 400);
    }

    await emitSecurityEvent({
      eventType: "account_created",
      severity: "info",
      ip: clientIp,
      payload: { emailDomain: email.split("@")[1] ?? "unknown" },
    });

    return NextResponse.json({
      data: {
        hasSession: Boolean(data.session),
        message: data.session
          ? null
          : "Account created. Check your email to confirm your registration.",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0]?.message ?? "Invalid payload", 400);
    }
    return apiError("Sign-up error.", 500);
  }
}
