import { createSign, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

interface OCRSpaceWord {
  WordText: string;
  Confidence: number;
  Left?: number;
  Top?: number;
  Width?: number;
  Height?: number;
}

interface OCRSpaceLine {
  Words: OCRSpaceWord[];
}

interface OCRSpaceParsedResult {
  ParsedText: string;
  TextOverlay?: {
    Lines?: OCRSpaceLine[];
  };
}

interface OCRSpaceResponse {
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string[] | string;
  ParsedResults?: OCRSpaceParsedResult[];
}

interface GoogleVertex {
  x?: number;
  y?: number;
}

interface GoogleNormalizedVertex {
  x?: number;
  y?: number;
}

interface GoogleBoundingPoly {
  vertices?: GoogleVertex[];
  normalizedVertices?: GoogleNormalizedVertex[];
}

interface GoogleDetectedBreak {
  type?: string;
}

interface GoogleSymbolProperty {
  detectedBreak?: GoogleDetectedBreak;
}

interface GoogleSymbol {
  text?: string;
  property?: GoogleSymbolProperty;
}

interface GoogleWord {
  symbols?: GoogleSymbol[];
  boundingBox?: GoogleBoundingPoly;
}

interface GoogleParagraph {
  words?: GoogleWord[];
}

interface GoogleBlock {
  paragraphs?: GoogleParagraph[];
}

interface GooglePage {
  width?: number;
  height?: number;
  blocks?: GoogleBlock[];
}

interface GoogleFullTextAnnotation {
  text?: string;
  pages?: GooglePage[];
}

interface GoogleTextAnnotation {
  description?: string;
  boundingPoly?: GoogleBoundingPoly;
}

interface GoogleVisionError {
  code?: number;
  message?: string;
}

interface GoogleVisionSingleResponse {
  textAnnotations?: GoogleTextAnnotation[];
  fullTextAnnotation?: GoogleFullTextAnnotation;
  error?: GoogleVisionError;
}

interface GoogleVisionResponse {
  responses?: GoogleVisionSingleResponse[];
}

interface GoogleServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleLongRunningOperationError {
  code?: number;
  message?: string;
}

interface GoogleLongRunningOperation {
  name?: string;
  done?: boolean;
  error?: GoogleLongRunningOperationError;
}

interface GoogleStorageListResponse {
  items?: Array<{ name?: string }>;
}

interface GoogleVisionAsyncFileResponse extends GoogleVisionSingleResponse {
  context?: { pageNumber?: number };
}

interface GoogleVisionAsyncOutputFile {
  responses?: GoogleVisionAsyncFileResponse[];
}

interface OCRServiceToken {
  text: string;
  confidence: number;
  lineIndex: number;
  wordIndex: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface OCRServiceResult {
  rawText: string;
  tokens: OCRServiceToken[];
}

interface BuildTokensResult {
  tokens: OCRServiceToken[];
  consumedLines: number;
}

interface PositionedWord {
  text: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface PositionedWordWithPage extends PositionedWord {
  pageIndex: number;
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(?:$|[?#])/i.test(url);
}

function base64UrlEncode(input: string | Buffer): string {
  const base64 = Buffer.from(input).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeObjectPathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function gcsUri(bucket: string, objectPath: string): string {
  return `gs://${bucket}/${objectPath}`;
}

function scoreOutputObjectName(name: string): number {
  const match = name.match(/output-(\d+)-to-(\d+)\.json$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number.parseInt(match[1], 10);
}

function getOCRSpaceApiKeyOrThrow(): string {
  const key = process.env.OCR_SPACE_API_KEY;
  if (!key) {
    throw new Error(
      "OCR not configured: OCR_SPACE_API_KEY variable is missing. Use manual entry.",
    );
  }
  return key;
}

function getGoogleVisionApiKeyOrThrow(): string {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!key) {
    throw new Error(
      "OCR not configured: GOOGLE_CLOUD_VISION_API_KEY variable is missing. Use manual entry.",
    );
  }
  return key;
}

function getGoogleVisionPdfBucketOrThrow(): string {
  const bucket = process.env.GOOGLE_CLOUD_VISION_PDF_BUCKET?.trim();
  if (!bucket) {
    throw new Error(
      "Google Vision async PDF not configured: GOOGLE_CLOUD_VISION_PDF_BUCKET variable is missing.",
    );
  }
  return bucket;
}

function parseServiceAccountJsonOrThrow(raw: string): GoogleServiceAccountCredentials {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "Google Vision async PDF not configured: invalid service account JSON.",
    );
  }

  const candidate = parsed as Partial<GoogleServiceAccountCredentials>;
  if (!candidate.client_email || !candidate.private_key) {
    throw new Error(
      "Google Vision async PDF not configured: client_email/private_key missing.",
    );
  }
  return {
    client_email: candidate.client_email,
    private_key: candidate.private_key,
    token_uri: candidate.token_uri,
  };
}

async function getGoogleServiceAccountCredentialsOrThrow(): Promise<GoogleServiceAccountCredentials> {
  const inlineJson = process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_JSON;
  if (inlineJson?.trim()) {
    return parseServiceAccountJsonOrThrow(inlineJson);
  }

  const jsonFile = process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_FILE?.trim();
  if (jsonFile) {
    const fileContent = await readFile(jsonFile, "utf8");
    return parseServiceAccountJsonOrThrow(fileContent);
  }

  throw new Error(
    "Google Vision async PDF not configured: add GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_JSON or GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_FILE.",
  );
}

function normalizeErrorMessage(message?: string[] | string): string {
  if (!message) return "Unknown OCR error";
  if (Array.isArray(message)) return message.join(" ");
  return message;
}

function normalizeGoogleVisionErrorMessage(
  message: string,
  imageUrl: string,
): string {
  if (isPdfUrl(imageUrl)) {
    return "Google Vision async PDF failed. Check the bucket, the service account permissions and the PDF format.";
  }
  if (/Bad image data/i.test(message)) {
    return "Google Vision could not read the source image. Check the format (PNG/JPG) and that the content is valid.";
  }
  if (/does not appear to be accessible/i.test(message)) {
    return "Google Vision cannot access the provided URL. Check that the file is public and accessible without authentication.";
  }
  return message;
}

async function getGoogleAccessToken(
  credentials: GoogleServiceAccountCredentials,
): Promise<string> {
  const tokenUri = credentials.token_uri ?? "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(credentials.private_key);
  const assertion = `${unsignedToken}.${base64UrlEncode(signature)}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const payloadJson = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !payloadJson.access_token) {
    const message =
      payloadJson.error_description ??
      payloadJson.error ??
      `HTTP ${response.status}`;
    throw new Error(`Google Vision auth failed: ${message}`);
  }
  return payloadJson.access_token;
}

async function uploadPdfFromPublicUrlToGcs(params: {
  imageUrl: string;
  bucket: string;
  objectPath: string;
  accessToken: string;
}): Promise<void> {
  const sourceResponse = await fetch(params.imageUrl, {
    method: "GET",
    cache: "no-store",
  });
  if (!sourceResponse.ok) {
    throw new Error(
      `Unable to download the source PDF (${sourceResponse.status}).`,
    );
  }

  const contentType =
    sourceResponse.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/pdf") && !isPdfUrl(params.imageUrl)) {
    throw new Error(
      "The source file does not appear to be a valid PDF for Google Vision async.",
    );
  }

  const binaryBody = Buffer.from(await sourceResponse.arrayBuffer());
  const uploadUrl =
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(params.bucket)}/o` +
    `?uploadType=media&name=${encodeURIComponent(params.objectPath)}`;

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/pdf",
    },
    body: binaryBody,
    cache: "no-store",
  });

  if (!uploadResponse.ok) {
    const details = await uploadResponse.text();
    throw new Error(
      `GCS PDF upload failed (${uploadResponse.status}): ${details.slice(0, 300)}`,
    );
  }
}

async function startVisionAsyncPdfOperation(params: {
  bucket: string;
  inputObjectPath: string;
  outputPrefix: string;
  accessToken: string;
}): Promise<string> {
  const response = await fetch("https://vision.googleapis.com/v1/files:asyncBatchAnnotate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          inputConfig: {
            gcsSource: { uri: gcsUri(params.bucket, params.inputObjectPath) },
            mimeType: "application/pdf",
          },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          outputConfig: {
            gcsDestination: { uri: gcsUri(params.bucket, params.outputPrefix) },
            batchSize: 20,
          },
        },
      ],
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as GoogleLongRunningOperation;
  if (!response.ok || !payload.name) {
    const details = payload.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Google Vision async start failed: ${details}`);
  }
  return payload.name;
}

async function waitForVisionOperation(params: {
  operationName: string;
  accessToken: string;
  timeoutMs: number;
  pollIntervalMs: number;
}): Promise<void> {
  const deadline = Date.now() + params.timeoutMs;

  while (Date.now() < deadline) {
    const response = await fetch(
      `https://vision.googleapis.com/v1/${params.operationName}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${params.accessToken}` },
        cache: "no-store",
      },
    );

    const payload = (await response.json()) as GoogleLongRunningOperation;
    if (!response.ok) {
      const details = payload.error?.message ?? `HTTP ${response.status}`;
      throw new Error(`Google Vision operation polling failed: ${details}`);
    }
    if (payload.done) {
      if (payload.error?.message) {
        throw new Error(`Google Vision operation failed: ${payload.error.message}`);
      }
      return;
    }

    await sleep(params.pollIntervalMs);
  }

  throw new Error("Google Vision async timeout: operation not completed.");
}

async function listGcsObjectNames(params: {
  bucket: string;
  prefix: string;
  accessToken: string;
}): Promise<string[]> {
  const listUrl =
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(params.bucket)}/o` +
    `?prefix=${encodeURIComponent(params.prefix)}`;
  const response = await fetch(listUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${params.accessToken}` },
    cache: "no-store",
  });

  const payload = (await response.json()) as GoogleStorageListResponse;
  if (!response.ok) {
    throw new Error(`GCS listing failed (${response.status}).`);
  }

  return (payload.items ?? [])
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));
}

async function readGcsJsonObject<T>(params: {
  bucket: string;
  objectName: string;
  accessToken: string;
}): Promise<T> {
  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(params.bucket)}/o/${encodeURIComponent(params.objectName)}?alt=media`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${params.accessToken}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to read GCS result (${response.status}) for ${params.objectName}.`,
    );
  }
  return (await response.json()) as T;
}

async function deleteGcsObject(params: {
  bucket: string;
  objectName: string;
  accessToken: string;
}): Promise<void> {
  await fetch(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(params.bucket)}/o/${encodeURIComponent(params.objectName)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${params.accessToken}` },
      cache: "no-store",
    },
  );
}

async function cleanupGcsObjects(params: {
  bucket: string;
  objectNames: string[];
  accessToken: string;
}): Promise<void> {
  if (params.objectNames.length === 0) return;
  await Promise.all(
    params.objectNames.map((objectName) =>
      deleteGcsObject({
        bucket: params.bucket,
        objectName,
        accessToken: params.accessToken,
      }).catch(() => undefined),
    ),
  );
}

async function parseVisionAsyncPdfResult(params: {
  bucket: string;
  outputPrefix: string;
  accessToken: string;
}): Promise<OCRServiceResult> {
  const objectNames = await listGcsObjectNames({
    bucket: params.bucket,
    prefix: params.outputPrefix,
    accessToken: params.accessToken,
  });

  const outputJsonObjects = objectNames
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => scoreOutputObjectName(a) - scoreOutputObjectName(b));

  if (outputJsonObjects.length === 0) {
    throw new Error("Google Vision async produced no JSON file.");
  }

  const pageChunks: Array<{ pageNumber: number; text: string }> = [];
  const positionedWords: PositionedWord[] = [];
  let fallbackPageNumber = 1;

  for (const objectName of outputJsonObjects) {
    const outputFile = await readGcsJsonObject<GoogleVisionAsyncOutputFile>({
      bucket: params.bucket,
      objectName,
      accessToken: params.accessToken,
    });

    for (const response of outputFile.responses ?? []) {
      if (response.error?.message) {
        throw new Error(`Google Vision failed: ${response.error.message}`);
      }
      const text =
        response.fullTextAnnotation?.text ??
        response.textAnnotations?.[0]?.description ??
        "";
      if (!text.trim()) {
        fallbackPageNumber += 1;
        continue;
      }
      const pageNumber = response.context?.pageNumber ?? fallbackPageNumber;
      const responseWords = extractPositionedWordsFromFullTextAnnotation(
        response.fullTextAnnotation,
      );
      if (responseWords.length > 0) {
        positionedWords.push(...withPageYOffset(responseWords, pageNumber));
      }
      pageChunks.push({ pageNumber, text: text.trim() });
      fallbackPageNumber = pageNumber + 1;
    }
  }

  if (pageChunks.length === 0) {
    throw new Error("Google Vision async returned no usable text.");
  }

  const rawText = pageChunks
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((chunk) => chunk.text)
    .join("\n\n");

  if (positionedWords.length > 0) {
    return {
      rawText,
      tokens: groupWordsIntoRows(positionedWords),
    };
  }

  return {
    rawText,
    tokens: tokenizeRawText(rawText, 0).tokens,
  };
}

async function detectTextWithGoogleVisionPdfAsync(
  imageUrl: string,
): Promise<OCRServiceResult> {
  const bucket = getGoogleVisionPdfBucketOrThrow();
  const credentials = await getGoogleServiceAccountCredentialsOrThrow();
  const accessToken = await getGoogleAccessToken(credentials);

  const now = Date.now();
  const uuid = randomUUID();
  const inputObjectPath = `vision-pdf-input/${now}-${uuid}.pdf`;
  const outputPrefix = `vision-pdf-output/${now}-${sanitizeObjectPathSegment(uuid)}/`;
  let outputObjectNames: string[] = [];

  try {
    await uploadPdfFromPublicUrlToGcs({
      imageUrl,
      bucket,
      objectPath: inputObjectPath,
      accessToken,
    });

    const operationName = await startVisionAsyncPdfOperation({
      bucket,
      inputObjectPath,
      outputPrefix,
      accessToken,
    });

    await waitForVisionOperation({
      operationName,
      accessToken,
      timeoutMs: parsePositiveIntEnv("GOOGLE_CLOUD_VISION_PDF_TIMEOUT_MS", 90000),
      pollIntervalMs: parsePositiveIntEnv(
        "GOOGLE_CLOUD_VISION_PDF_POLL_INTERVAL_MS",
        1500,
      ),
    });

    const result = await parseVisionAsyncPdfResult({
      bucket,
      outputPrefix,
      accessToken,
    });

    outputObjectNames = await listGcsObjectNames({
      bucket,
      prefix: outputPrefix,
      accessToken,
    });

    return result;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Google Vision async PDF failed.",
    );
  } finally {
    await cleanupGcsObjects({
      bucket,
      objectNames: [inputObjectPath, ...outputObjectNames],
      accessToken,
    });
  }
}

function tokenizeRawText(rawText: string, startLineIndex: number): BuildTokensResult {
  const lines = rawText.split(/\r?\n/);
  const tokens: OCRServiceToken[] = [];

  lines.forEach((line, lineOffset) => {
    const words = line.matchAll(/\S+/g);
    let wordIndex = 0;

    for (const match of words) {
      tokens.push({
        text: match[0],
        confidence: 100,
        lineIndex: startLineIndex + lineOffset,
        wordIndex,
      });
      wordIndex += 1;
    }
  });

  return {
    tokens,
    consumedLines: lines.length || 1,
  };
}

function tokenizeOCRSpaceOverlayLines(
  lines: OCRSpaceLine[],
  startLineIndex: number,
): BuildTokensResult {
  const tokens: OCRServiceToken[] = [];

  lines.forEach((line, lineOffset) => {
    line.Words.forEach((word, wordIndex) => {
      tokens.push({
        text: word.WordText,
        confidence: Number.isFinite(word.Confidence) ? word.Confidence : 0,
        lineIndex: startLineIndex + lineOffset,
        wordIndex,
        x: Number.isFinite(word.Left) ? Number(word.Left) : undefined,
        y: Number.isFinite(word.Top) ? Number(word.Top) : undefined,
        width: Number.isFinite(word.Width) ? Number(word.Width) : undefined,
        height: Number.isFinite(word.Height) ? Number(word.Height) : undefined,
      });
    });
  });

  return {
    tokens,
    consumedLines: lines.length || 1,
  };
}

function buildOCRSpaceResult(parsedResults: OCRSpaceParsedResult[]): OCRServiceResult {
  const rawText = parsedResults
    .map((result) => result.ParsedText ?? "")
    .filter((chunk) => chunk.trim().length > 0)
    .join("\n\n");

  const tokens: OCRServiceToken[] = [];
  let lineOffset = 0;

  parsedResults.forEach((result) => {
    const overlayLines = result.TextOverlay?.Lines ?? [];
    const hasOverlay = overlayLines.length > 0;

    const tokenized = hasOverlay
      ? tokenizeOCRSpaceOverlayLines(overlayLines, lineOffset)
      : tokenizeRawText(result.ParsedText ?? "", lineOffset);

    tokens.push(...tokenized.tokens);
    lineOffset += tokenized.consumedLines;
  });

  return { rawText, tokens };
}

function getBounds(
  boundingPoly: GoogleBoundingPoly | undefined,
  pageWidth?: number,
  pageHeight?: number,
): { x?: number; y?: number; width?: number; height?: number } {
  const vertices = boundingPoly?.vertices ?? [];
  const xs = vertices.map((v) => v.x).filter((x): x is number => Number.isFinite(x));
  const ys = vertices.map((v) => v.y).filter((y): y is number => Number.isFinite(y));
  if (xs.length === 0 || ys.length === 0) {
    const normalizedVertices = boundingPoly?.normalizedVertices;
    if (!normalizedVertices || normalizedVertices.length === 0) return {};

    const normXs = normalizedVertices
      .map((v) => v.x)
      .filter((x): x is number => Number.isFinite(x));
    const normYs = normalizedVertices
      .map((v) => v.y)
      .filter((y): y is number => Number.isFinite(y));
    if (normXs.length === 0 || normYs.length === 0) return {};

    const resolvedWidth =
      typeof pageWidth === "number" && Number.isFinite(pageWidth) && pageWidth > 0
        ? pageWidth
        : 1000;
    const resolvedHeight =
      typeof pageHeight === "number" &&
      Number.isFinite(pageHeight) &&
      pageHeight > 0
        ? pageHeight
        : 1000;

    const minNormX = Math.min(...normXs);
    const maxNormX = Math.max(...normXs);
    const minNormY = Math.min(...normYs);
    const maxNormY = Math.max(...normYs);

    return {
      x: minNormX * resolvedWidth,
      y: minNormY * resolvedHeight,
      width: Math.max(1, (maxNormX - minNormX) * resolvedWidth),
      height: Math.max(1, (maxNormY - minNormY) * resolvedHeight),
    };
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

function getWordText(word: GoogleWord): string {
  const symbols = word.symbols ?? [];
  if (symbols.length === 0) return "";
  return symbols.map((symbol) => symbol.text ?? "").join("").trim();
}

function extractPositionedWordsFromFullTextAnnotation(
  annotation: GoogleFullTextAnnotation | undefined,
): PositionedWordWithPage[] {
  const pages = annotation?.pages ?? [];
  if (pages.length === 0) return [];

  const words: PositionedWordWithPage[] = [];

  pages.forEach((page, pageIndex) => {
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) {
          const text = getWordText(word);
          if (!text) continue;
          const bounds = getBounds(word.boundingBox, page.width, page.height);
          words.push({
            pageIndex,
            text,
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          });
        }
      }
    }
  });

  return words;
}

function withPageYOffset(
  words: PositionedWordWithPage[],
  pageNumberStart: number,
): PositionedWord[] {
  const PAGE_VERTICAL_OFFSET = 100000;

  return words.map((word) => {
    const resolvedPageNumber = pageNumberStart + word.pageIndex;
    const yOffset = Math.max(0, resolvedPageNumber - 1) * PAGE_VERTICAL_OFFSET;

    return {
      text: word.text,
      x: word.x,
      y: Number.isFinite(word.y) ? (word.y as number) + yOffset : undefined,
      width: word.width,
      height: word.height,
    };
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function groupWordsIntoRows(words: PositionedWord[]): OCRServiceToken[] {
  if (words.length === 0) return [];

  const withY = words.filter((word) => Number.isFinite(word.y));
  if (withY.length === 0) {
    return words.map((word, index) => ({
      text: word.text,
      confidence: 90,
      lineIndex: 0,
      wordIndex: index,
      x: word.x,
      y: word.y,
      width: word.width,
      height: word.height,
    }));
  }

  const heights = withY
    .map((word) => word.height)
    .filter((h): h is number => typeof h === "number" && Number.isFinite(h) && h > 0);
  const baseHeight = median(heights) || 18;
  const tolerance = Math.max(8, Math.min(24, baseHeight * 0.7));

  const sorted = [...words].sort((a, b) => {
    const ay = Number.isFinite(a.y) ? (a.y as number) : Number.POSITIVE_INFINITY;
    const by = Number.isFinite(b.y) ? (b.y as number) : Number.POSITIVE_INFINITY;
    if (ay !== by) return ay - by;
    const ax = Number.isFinite(a.x) ? (a.x as number) : Number.POSITIVE_INFINITY;
    const bx = Number.isFinite(b.x) ? (b.x as number) : Number.POSITIVE_INFINITY;
    return ax - bx;
  });

  const rows: Array<{ centerY: number; words: PositionedWord[] }> = [];

  for (const word of sorted) {
    const y = Number.isFinite(word.y) ? (word.y as number) : null;
    if (y === null) continue;

    let bestRow = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < rows.length; i += 1) {
      const diff = Math.abs(rows[i].centerY - y);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestRow = i;
      }
    }

    if (bestRow >= 0 && bestDiff <= tolerance) {
      const row = rows[bestRow];
      const n = row.words.length;
      row.words.push(word);
      row.centerY = (row.centerY * n + y) / (n + 1);
    } else {
      rows.push({ centerY: y, words: [word] });
    }
  }

  return rows
    .sort((a, b) => a.centerY - b.centerY)
    .flatMap((row, lineIndex) => {
      const rowWords = [...row.words].sort((a, b) => {
        const ax = Number.isFinite(a.x) ? (a.x as number) : Number.POSITIVE_INFINITY;
        const bx = Number.isFinite(b.x) ? (b.x as number) : Number.POSITIVE_INFINITY;
        return ax - bx;
      });

      return rowWords.map((word, wordIndex) => ({
        text: word.text,
        confidence: 90,
        lineIndex,
        wordIndex,
        x: word.x,
        y: word.y,
        width: word.width,
        height: word.height,
      }));
    });
}

function buildGoogleVisionResult(response: GoogleVisionSingleResponse): OCRServiceResult {
  const annotations = response.textAnnotations ?? [];
  const rawText =
    response.fullTextAnnotation?.text ?? annotations[0]?.description ?? "";

  if (annotations.length <= 1) {
    return {
      rawText,
      tokens: tokenizeRawText(rawText, 0).tokens,
    };
  }

  const words: PositionedWord[] = annotations.slice(1).flatMap((annotation) => {
    const text = annotation.description?.trim() ?? "";
    if (!text) return [];
    const bounds = getBounds(annotation.boundingPoly);
    return [
      {
        text,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
    ];
  });

  return {
    rawText,
    tokens: groupWordsIntoRows(words),
  };
}

export async function detectTextWithOCRSpace(imageUrl: string): Promise<OCRServiceResult> {
  const apiKey = getOCRSpaceApiKeyOrThrow();

  const body = new URLSearchParams({
    apikey: apiKey,
    url: imageUrl,
    language: "eng",
    isOverlayRequired: "true",
    OCREngine: "2",
    detectOrientation: "true",
    scale: "true",
  });

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `OCR.space unavailable (${response.status}). Try again later or use manual entry.`,
    );
  }

  const payload = (await response.json()) as OCRSpaceResponse;

  if (payload.IsErroredOnProcessing) {
    throw new Error(
      `OCR.space failed: ${normalizeErrorMessage(payload.ErrorMessage)}. Use manual entry if needed.`,
    );
  }

  const parsedResults = payload.ParsedResults ?? [];
  if (!parsedResults.length) {
    throw new Error("OCR.space returned no usable result.");
  }

  return buildOCRSpaceResult(parsedResults);
}

export async function detectTextWithGoogleVision(imageUrl: string): Promise<OCRServiceResult> {
  if (isPdfUrl(imageUrl)) {
    return detectTextWithGoogleVisionPdfAsync(imageUrl);
  }
  const apiKey = getGoogleVisionApiKeyOrThrow();

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            imageContext: { languageHints: ["en"] },
          },
        ],
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let details = "";
    try {
      const body = await response.json();
      const apiMessage =
        body?.error?.message ??
        body?.responses?.[0]?.error?.message ??
        "";
      if (typeof apiMessage === "string" && apiMessage.trim()) {
        details = `: ${normalizeGoogleVisionErrorMessage(apiMessage, imageUrl)}`;
      }
    } catch {
      // Ignore parse errors and keep generic message.
    }
    throw new Error(
      `Google Vision unavailable (${response.status})${details}. Try again later or use manual entry.`,
    );
  }

  const payload = (await response.json()) as GoogleVisionResponse;
  const first = payload.responses?.[0];
  if (!first) {
    throw new Error("Google Vision returned no usable result.");
  }
  if (first.error?.message) {
    throw new Error(
      `Google Vision failed: ${normalizeGoogleVisionErrorMessage(first.error.message, imageUrl)}`,
    );
  }

  return buildGoogleVisionResult(first);
}
