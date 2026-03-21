import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function buildCsp(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const connectSrc = [
    "'self'",
    ...(supabaseUrl ? [supabaseUrl] : []),
    ...(upstashUrl ? [upstashUrl] : []),
  ];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    `connect-src ${connectSrc.join(" ")}`,
    "upgrade-insecure-requests",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: buildCsp() },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
