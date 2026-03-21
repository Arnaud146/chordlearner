const DEFAULT_REDIRECT_PATH = "/songs";

export function sanitizeRedirectPath(
  redirectPath: string | null | undefined,
): string {
  if (!redirectPath) return DEFAULT_REDIRECT_PATH;
  if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }
  // Block backslash-based and encoded-slash open redirect bypasses
  if (redirectPath.startsWith("/\\") || /^\/%2f/i.test(redirectPath)) {
    return DEFAULT_REDIRECT_PATH;
  }
  // Parse and confirm no host component is produced
  try {
    const parsed = new URL(redirectPath, "https://placeholder.invalid");
    if (parsed.host !== "placeholder.invalid") return DEFAULT_REDIRECT_PATH;
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
  return redirectPath;
}

export { DEFAULT_REDIRECT_PATH };
