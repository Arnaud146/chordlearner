/**
 * SSRF protection: validates that a URL is safe to fetch server-side.
 * Blocks private IPs, loopback, metadata endpoints, and non-HTTP protocols.
 */

const PRIVATE_IP_PATTERN =
  /^(localhost|127\.|0\.0\.0\.0|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fe80:|0000:|fd)/i;

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export function assertSafeUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeUrlError("Invalid URL.");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new UnsafeUrlError("Only HTTP and HTTPS protocols are allowed.");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (PRIVATE_IP_PATTERN.test(hostname)) {
    throw new UnsafeUrlError("Target URL not allowed.");
  }

  // Block numeric IPs that resolve to private ranges (e.g., 0x7f000001)
  if (/^\d+$/.test(hostname)) {
    throw new UnsafeUrlError("Target URL not allowed.");
  }

  return parsed;
}
