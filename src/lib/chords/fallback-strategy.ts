import type { ExtractionMode, SourceKind } from "../../types/chords";

interface DetectionOptions {
  url: string;
  contentType?: string | null;
}

function normalizeContentType(value?: string | null): string {
  return (value ?? "").toLowerCase();
}

export function detectSourceKind(options: DetectionOptions): SourceKind {
  const normalizedContentType = normalizeContentType(options.contentType);
  if (normalizedContentType.includes("text/html")) return "html";
  if (normalizedContentType.includes("application/pdf")) return "pdf";
  if (normalizedContentType.includes("image/")) return "image";

  try {
    const url = new URL(options.url);
    const pathname = url.pathname.toLowerCase();

    if (pathname.endsWith(".pdf")) return "pdf";
    if (/\.(png|jpe?g|webp|gif|bmp|tiff?|svg)$/.test(pathname)) return "image";
    if (/\.(html?|php|aspx?)$/.test(pathname)) return "html";
    if (!/\.[a-z0-9]+$/i.test(pathname)) return "html";
  } catch {
    return "unknown";
  }

  return "unknown";
}

export function shouldUseWebExtraction(params: {
  sourceKind: SourceKind;
  preferredMode?: ExtractionMode;
}): boolean {
  if (params.preferredMode === "ocr" || params.preferredMode === "manual") {
    return false;
  }

  return params.sourceKind === "html" || params.sourceKind === "unknown";
}

export function shouldFallbackToOcr(params: {
  sourceKind: SourceKind;
  preferredMode?: ExtractionMode;
  webSucceeded: boolean;
}): boolean {
  if (params.preferredMode === "manual") return false;
  if (params.preferredMode === "ocr") return true;
  if (params.sourceKind === "pdf" || params.sourceKind === "image") return true;
  return !params.webSucceeded;
}
