import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detectTextWithGoogleVision,
  detectTextWithOCRSpace,
} from "./ocr.service";

const ORIGINAL_OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY;
const ORIGINAL_GOOGLE_VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;
const ORIGINAL_GOOGLE_VISION_SERVICE_ACCOUNT_JSON =
  process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_JSON;
const ORIGINAL_GOOGLE_VISION_SERVICE_ACCOUNT_FILE =
  process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_FILE;
const ORIGINAL_GOOGLE_VISION_PDF_BUCKET =
  process.env.GOOGLE_CLOUD_VISION_PDF_BUCKET;

function mockFetchJson(payload: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ocr service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    if (typeof ORIGINAL_OCR_SPACE_API_KEY === "string") {
      process.env.OCR_SPACE_API_KEY = ORIGINAL_OCR_SPACE_API_KEY;
    } else {
      delete process.env.OCR_SPACE_API_KEY;
    }
    if (typeof ORIGINAL_GOOGLE_VISION_API_KEY === "string") {
      process.env.GOOGLE_CLOUD_VISION_API_KEY = ORIGINAL_GOOGLE_VISION_API_KEY;
    } else {
      delete process.env.GOOGLE_CLOUD_VISION_API_KEY;
    }
    if (typeof ORIGINAL_GOOGLE_VISION_SERVICE_ACCOUNT_JSON === "string") {
      process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_JSON =
        ORIGINAL_GOOGLE_VISION_SERVICE_ACCOUNT_JSON;
    } else {
      delete process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_JSON;
    }
    if (typeof ORIGINAL_GOOGLE_VISION_SERVICE_ACCOUNT_FILE === "string") {
      process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_FILE =
        ORIGINAL_GOOGLE_VISION_SERVICE_ACCOUNT_FILE;
    } else {
      delete process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_FILE;
    }
    if (typeof ORIGINAL_GOOGLE_VISION_PDF_BUCKET === "string") {
      process.env.GOOGLE_CLOUD_VISION_PDF_BUCKET =
        ORIGINAL_GOOGLE_VISION_PDF_BUCKET;
    } else {
      delete process.env.GOOGLE_CLOUD_VISION_PDF_BUCKET;
    }
  });

  it("aggregates OCR.space tokens across parsed results", async () => {
    process.env.OCR_SPACE_API_KEY = "test-key";

    mockFetchJson({
      IsErroredOnProcessing: false,
      ParsedResults: [
        {
          ParsedText: "C G\nAm",
          TextOverlay: {
            Lines: [
              {
                Words: [
                  { WordText: "C", Confidence: 95, Left: 10, Top: 10, Width: 12, Height: 12 },
                  { WordText: "G", Confidence: 93, Left: 50, Top: 10, Width: 12, Height: 12 },
                ],
              },
              {
                Words: [{ WordText: "Am", Confidence: 91, Left: 30, Top: 30, Width: 20, Height: 12 }],
              },
            ],
          },
        },
        {
          ParsedText: "F C/E",
          TextOverlay: {
            Lines: [
              {
                Words: [
                  { WordText: "F", Confidence: 90, Left: 10, Top: 10, Width: 10, Height: 12 },
                  { WordText: "C/E", Confidence: 88, Left: 40, Top: 10, Width: 24, Height: 12 },
                ],
              },
            ],
          },
        },
      ],
    });

    const result = await detectTextWithOCRSpace("https://example.com/song.pdf");

    expect(result.rawText).toBe("C G\nAm\n\nF C/E");
    expect(result.tokens.map((token) => token.text)).toEqual([
      "C",
      "G",
      "Am",
      "F",
      "C/E",
    ]);
    expect(result.tokens.map((token) => token.lineIndex)).toEqual([0, 0, 1, 2, 2]);
    expect(result.tokens[0].x).toBe(10);
  });

  it("falls back to ParsedText tokenization when OCR.space overlay is missing", async () => {
    process.env.OCR_SPACE_API_KEY = "test-key";

    mockFetchJson({
      IsErroredOnProcessing: false,
      ParsedResults: [
        {
          ParsedText: "C / E\nAm / G",
        },
      ],
    });

    const result = await detectTextWithOCRSpace("https://example.com/song.pdf");

    expect(result.tokens.map((token) => token.text)).toEqual([
      "C",
      "/",
      "E",
      "Am",
      "/",
      "G",
    ]);
    expect(result.tokens.every((token) => token.confidence === 100)).toBe(true);
    expect(result.tokens.map((token) => token.lineIndex)).toEqual([0, 0, 0, 1, 1, 1]);
  });

  it("parses Google Vision text annotations with positions", async () => {
    process.env.GOOGLE_CLOUD_VISION_API_KEY = "google-test-key";

    mockFetchJson({
      responses: [
        {
          fullTextAnnotation: { text: "C G\nAm" },
          textAnnotations: [
            { description: "C G\nAm" },
            {
              description: "C",
              boundingPoly: { vertices: [{ x: 10, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 20 }, { x: 10, y: 20 }] },
            },
            {
              description: "G",
              boundingPoly: { vertices: [{ x: 60, y: 11 }, { x: 70, y: 11 }, { x: 70, y: 21 }, { x: 60, y: 21 }] },
            },
            {
              description: "Am",
              boundingPoly: { vertices: [{ x: 30, y: 45 }, { x: 52, y: 45 }, { x: 52, y: 57 }, { x: 30, y: 57 }] },
            },
          ],
        },
      ],
    });

    const result = await detectTextWithGoogleVision("https://example.com/song.png");

    expect(result.rawText).toBe("C G\nAm");
    expect(result.tokens.map((token) => token.text)).toEqual(["C", "G", "Am"]);
    expect(result.tokens.map((token) => token.lineIndex)).toEqual([0, 0, 1]);
    expect(result.tokens[0].x).toBe(10);
    expect(result.tokens[2].y).toBe(45);
  });

  it("fails on PDF when async Google Vision config is missing", async () => {
    process.env.GOOGLE_CLOUD_VISION_API_KEY = "google-test-key";
    delete process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_JSON;
    delete process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_FILE;
    delete process.env.GOOGLE_CLOUD_VISION_PDF_BUCKET;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      detectTextWithGoogleVision("https://example.com/chords.pdf"),
    ).rejects.toThrow("Google Vision async PDF not configured");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps inaccessible URL errors to an actionable message", async () => {
    process.env.GOOGLE_CLOUD_VISION_API_KEY = "google-test-key";

    mockFetchJson({
      responses: [
        {
          error: {
            code: 3,
            message:
              "The URL does not appear to be accessible by us. Please double check or download the content and pass it in.",
          },
        },
      ],
    });

    await expect(
      detectTextWithGoogleVision("https://example.com/private-image.png"),
    ).rejects.toThrow("cannot access the provided URL");
  });

  it("extracts positioned rows for Google Vision async PDF flow", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 1024 });
    const privateKeyPem = privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString();

    process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "vision-test@project.iam.gserviceaccount.com",
      private_key: privateKeyPem,
      token_uri: "https://oauth2.googleapis.com/token",
    });
    process.env.GOOGLE_CLOUD_VISION_PDF_BUCKET = "vision-pdf-test-bucket";

    let listCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "https://oauth2.googleapis.com/token") {
        return jsonResponse({ access_token: "test-access-token" });
      }
      if (url === "https://example.com/song.pdf") {
        return new Response("%PDF-1.4", {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        });
      }
      if (
        url.startsWith("https://storage.googleapis.com/upload/storage/v1/b/")
      ) {
        return jsonResponse({ id: "uploaded" });
      }
      if (url === "https://vision.googleapis.com/v1/files:asyncBatchAnnotate") {
        return jsonResponse({ name: "operations/vision-op-1" });
      }
      if (url === "https://vision.googleapis.com/v1/operations/vision-op-1") {
        return jsonResponse({ done: true });
      }
      if (
        url.startsWith("https://storage.googleapis.com/storage/v1/b/") &&
        url.includes("?prefix=")
      ) {
        listCount += 1;
        return jsonResponse({
          items: [
            {
              name: "vision-pdf-output/test-uuid/output-1-to-1.json",
            },
          ],
        });
      }
      if (url.includes("?alt=media")) {
        return jsonResponse({
          responses: [
            {
              context: { pageNumber: 1 },
              fullTextAnnotation: {
                text: "A G#\nD E7",
                pages: [
                  {
                    width: 1000,
                    height: 2000,
                    blocks: [
                      {
                        paragraphs: [
                          {
                            words: [
                              {
                                symbols: [{ text: "A" }],
                                boundingBox: {
                                  normalizedVertices: [
                                    { x: 0.1, y: 0.1 },
                                    { x: 0.12, y: 0.1 },
                                    { x: 0.12, y: 0.11 },
                                    { x: 0.1, y: 0.11 },
                                  ],
                                },
                              },
                              {
                                symbols: [{ text: "G" }, { text: "#" }],
                                boundingBox: {
                                  normalizedVertices: [
                                    { x: 0.3, y: 0.1 },
                                    { x: 0.34, y: 0.1 },
                                    { x: 0.34, y: 0.11 },
                                    { x: 0.3, y: 0.11 },
                                  ],
                                },
                              },
                              {
                                symbols: [{ text: "D" }],
                                boundingBox: {
                                  normalizedVertices: [
                                    { x: 0.1, y: 0.2 },
                                    { x: 0.12, y: 0.2 },
                                    { x: 0.12, y: 0.21 },
                                    { x: 0.1, y: 0.21 },
                                  ],
                                },
                              },
                              {
                                symbols: [{ text: "E" }, { text: "7" }],
                                boundingBox: {
                                  normalizedVertices: [
                                    { x: 0.3, y: 0.2 },
                                    { x: 0.34, y: 0.2 },
                                    { x: 0.34, y: 0.21 },
                                    { x: 0.3, y: 0.21 },
                                  ],
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        });
      }
      if (
        url.startsWith("https://storage.googleapis.com/storage/v1/b/") &&
        init?.method === "DELETE"
      ) {
        return new Response("", { status: 204 });
      }

      throw new Error(`Unexpected fetch in test: ${url}`);
    });

    const result = await detectTextWithGoogleVision("https://example.com/song.pdf");

    expect(result.rawText).toContain("A G#");
    expect(result.tokens.map((token) => token.text)).toEqual(["A", "G#", "D", "E7"]);
    expect(result.tokens[0].x).toBe(100);
    expect(result.tokens[2].lineIndex).toBe(1);
    expect(listCount).toBeGreaterThanOrEqual(2);
  });
});
