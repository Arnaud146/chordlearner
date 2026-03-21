type Entry = { count: number; resetAt: number };
const localBuckets = new Map<string, Entry>();

export interface RateLimitResult {
  allowed: boolean;
  used: number;
  remaining: number;
  retryAfterSeconds: number;
}

interface ConsumeParams {
  key: string;
  limit: number;
  windowMs: number;
}

function consumeLocal(params: ConsumeParams): RateLimitResult {
  const now = Date.now();
  const current = localBuckets.get(params.key);

  if (!current || current.resetAt <= now) {
    localBuckets.set(params.key, { count: 1, resetAt: now + params.windowMs });
    return {
      allowed: true,
      used: 1,
      remaining: Math.max(0, params.limit - 1),
      retryAfterSeconds: Math.ceil(params.windowMs / 1000),
    };
  }

  if (current.count >= params.limit) {
    return {
      allowed: false,
      used: current.count,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  localBuckets.set(params.key, current);
  return {
    allowed: true,
    used: current.count,
    remaining: Math.max(0, params.limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

async function consumeUpstash(params: ConsumeParams): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const endpoint = `${url.replace(/\/$/, "")}/pipeline`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", params.key],
      ["PEXPIRE", params.key, params.windowMs, "NX"],
      ["PTTL", params.key],
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash rate-limit error (${response.status})`);
  }

  const payload = (await response.json()) as Array<{ result?: unknown }>;
  const used = Number(payload?.[0]?.result);
  const ttlMs = Number(payload?.[2]?.result);
  if (!Number.isFinite(used) || used <= 0) {
    return null;
  }
  const retryAfterSeconds = Number.isFinite(ttlMs) && ttlMs > 0
    ? Math.max(1, Math.ceil(ttlMs / 1000))
    : Math.ceil(params.windowMs / 1000);
  return {
    allowed: used <= params.limit,
    used,
    remaining: Math.max(0, params.limit - used),
    retryAfterSeconds,
  };
}

export async function consumeRateLimit(params: ConsumeParams): Promise<RateLimitResult> {
  try {
    const distributed = await consumeUpstash(params);
    if (distributed) return distributed;
  } catch (error) {
    console.warn(
      "[rate-limit] distributed backend unavailable, using local fallback",
      error instanceof Error ? error.message : "unknown",
    );
  }
  return consumeLocal(params);
}
