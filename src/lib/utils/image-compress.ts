const DEFAULT_MAX_SIZE_KB = 950;
const DEFAULT_MAX_DIMENSION = 2048;

function scaleToFit(
  w: number,
  h: number,
  maxDim: number,
): { width: number; height: number } {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h };
  const ratio = Math.min(maxDim / w, maxDim / h);
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}

const UPSCALE_BELOW_DIMENSION = 800;
const CONTRAST_CLIP_FRACTION = 0.02;

/**
 * Prepares an image for OCR: upscales low-resolution captures, converts to
 * grayscale and stretches contrast so chord glyphs stand out, then encodes as
 * JPEG under OCR.space's ~1 MB limit. Contrast stretching is intentionally mild
 * (no hard binarization) to avoid destroying anti-aliased small text that cloud
 * OCR engines read well.
 */
export async function preprocessImageForOCR(
  file: File,
  maxSizeKB = DEFAULT_MAX_SIZE_KB,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = targetDimensions(bitmap.width, bitmap.height);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.imageSmoothingQuality = "high";
  // Flatten onto white first: transparent PNG regions would otherwise read as
  // RGB 0,0,0 and JPEG (no alpha) would render them solid black behind the text.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  applyGrayscaleContrast(imageData.data);
  ctx.putImageData(imageData, 0, 0);

  const name = file.name.replace(/\.[^.]+$/, ".jpg");
  return encodeUnderSize(canvas, name, maxSizeKB);
}

function targetDimensions(
  w: number,
  h: number,
): { width: number; height: number } {
  const maxDim = Math.max(w, h);
  if (maxDim > DEFAULT_MAX_DIMENSION) {
    return scaleToFit(w, h, DEFAULT_MAX_DIMENSION);
  }
  if (maxDim < UPSCALE_BELOW_DIMENSION) {
    const ratio = Math.min(2, DEFAULT_MAX_DIMENSION / maxDim);
    return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
  }
  return { width: w, height: h };
}

function applyGrayscaleContrast(data: Uint8ClampedArray): void {
  const histogram = new Array<number>(256).fill(0);
  const luma = new Uint8ClampedArray(data.length / 4);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const value = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
    );
    luma[p] = value;
    histogram[value] += 1;
  }

  const { low, high } = contrastBounds(histogram, luma.length);
  const range = high - low;

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const stretched =
      range > 0
        ? Math.max(0, Math.min(255, ((luma[p] - low) * 255) / range))
        : luma[p];
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }
}

function contrastBounds(
  histogram: number[],
  pixelCount: number,
): { low: number; high: number } {
  const clip = Math.floor(pixelCount * CONTRAST_CLIP_FRACTION);

  let low = 0;
  let cumulative = 0;
  for (let v = 0; v < 256; v += 1) {
    cumulative += histogram[v];
    if (cumulative > clip) {
      low = v;
      break;
    }
  }

  let high = 255;
  cumulative = 0;
  for (let v = 255; v >= 0; v -= 1) {
    cumulative += histogram[v];
    if (cumulative > clip) {
      high = v;
      break;
    }
  }

  return high > low ? { low, high } : { low: 0, high: 255 };
}

async function encodeUnderSize(
  canvas: OffscreenCanvas,
  name: string,
  maxSizeKB: number,
): Promise<File> {
  const MIN_QUALITY = 0.3;
  const STEP = 0.1;
  let quality = 0.9;

  while (quality > MIN_QUALITY) {
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    if (blob.size <= maxSizeKB * 1024) {
      return new File([blob], name, { type: "image/jpeg" });
    }
    quality -= STEP;
  }

  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: MIN_QUALITY,
  });
  return new File([blob], name, { type: "image/jpeg" });
}
