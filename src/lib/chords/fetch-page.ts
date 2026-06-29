import { assertSafeUrl } from "@/lib/security/safe-url";

export type FetchPageErrorCode =
  | "INVALID_URL"
  | "HTTP_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "NON_HTML_CONTENT";

export class FetchPageError extends Error {
  code: FetchPageErrorCode;
  status?: number;
  contentType?: string;

  constructor(
    code: FetchPageErrorCode,
    message: string,
    options?: { status?: number; contentType?: string },
  ) {
    super(message);
    this.name = "FetchPageError";
    this.code = code;
    this.status = options?.status;
    this.contentType = options?.contentType;
  }
}

export interface FetchPageResult {
  url: string;
  finalUrl: string;
  contentType: string;
  status: number;
  html: string;
}

const DEFAULT_TIMEOUT_MS = 12000;
const MAX_REDIRECTS = 5;

function parseTimeoutEnv(): number {
  const raw = process.env.WEB_EXTRACTION_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 2000 || value > 60000) {
    return DEFAULT_TIMEOUT_MS;
  }
  return value;
}

function validateUrl(url: string): URL {
  try {
    return assertSafeUrl(url);
  } catch {
    throw new FetchPageError("INVALID_URL", "Invalid or unauthorized URL.");
  }
}

export async function fetchPage(url: string): Promise<FetchPageResult> {
  const parsedUrl = validateUrl(url);

  const controller = new AbortController();
  const timeoutMs = parseTimeoutEnv();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    let currentUrl = parsedUrl;
    let response: Response | undefined;

    // Follow redirects manually to validate each target against SSRF
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      response = await fetch(currentUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "User-Agent":
            "ChordLearnerBot/1.0 (+https://chordlearner.local; web extraction)",
        },
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
      });

      if (![301, 302, 303, 307, 308].includes(response.status)) {
        break;
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new FetchPageError("HTTP_ERROR", "Redirect without a Location header.");
      }

      const redirectTarget = new URL(location, currentUrl);
      try {
        assertSafeUrl(redirectTarget.toString());
      } catch {
        throw new FetchPageError("INVALID_URL", "The redirect points to an unauthorized URL.");
      }
      currentUrl = redirectTarget;
    }

    if (!response) {
      throw new FetchPageError("NETWORK_ERROR", "No response received.");
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) {
      throw new FetchPageError(
        "HTTP_ERROR",
        `The page returned HTTP status ${response.status}.`,
        { status: response.status, contentType },
      );
    }

    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      throw new FetchPageError(
        "NON_HTML_CONTENT",
        `Non-HTML content type: ${contentType || "unknown"}.`,
        { status: response.status, contentType },
      );
    }

    const html = await response.text();

    return {
      url: parsedUrl.toString(),
      finalUrl: currentUrl.toString(),
      contentType,
      status: response.status,
      html,
    };
  } catch (error) {
    if (error instanceof FetchPageError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FetchPageError(
        "TIMEOUT",
        `Timeout of ${timeoutMs}ms reached while downloading the page.`,
      );
    }

    throw new FetchPageError(
      "NETWORK_ERROR",
      "Network error during web extraction.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
