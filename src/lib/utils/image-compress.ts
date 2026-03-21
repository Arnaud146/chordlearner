const DEFAULT_MAX_SIZE_KB = 950;
const DEFAULT_MAX_DIMENSION = 2048;

/**
 * Compresses an image file using a canvas to stay under OCR.space's 1 MB limit.
 * Iteratively reduces JPEG quality until the result fits within maxSizeKB.
 */
export async function compressImage(
  file: File,
  maxSizeKB = DEFAULT_MAX_SIZE_KB,
): Promise<File> {
  if (file.size <= maxSizeKB * 1024) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = scaleToFit(
    bitmap.width,
    bitmap.height,
    DEFAULT_MAX_DIMENSION,
  );

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.85;
  const MIN_QUALITY = 0.3;
  const STEP = 0.1;

  while (quality >= MIN_QUALITY) {
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    if (blob.size <= maxSizeKB * 1024 || quality <= MIN_QUALITY) {
      return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
    }
    quality -= STEP;
  }

  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: MIN_QUALITY,
  });
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

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
