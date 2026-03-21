import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const firstIp = xff.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
