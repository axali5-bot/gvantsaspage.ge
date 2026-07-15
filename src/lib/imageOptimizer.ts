/**
 * Client-side image optimizer for uploads: downscales to a web-friendly size
 * and re-encodes as WebP (JPEG fallback where the browser can't encode WebP,
 * e.g. older Safari). Runs entirely in the browser — no server, no deps.
 *
 * Fail-open by design: any decode/encode problem returns the ORIGINAL file so
 * an upload is never blocked by optimization.
 */

export interface OptimizeOptions {
  /** Longest edge of the output, px. Default 1600 (plenty for retina cards/tiles). */
  maxDim?: number;
  /** WebP/JPEG quality 0–1. Default 0.82. */
  quality?: number;
}

export interface OptimizeResult {
  file: File;
  originalBytes: number;
  optimizedBytes: number;
  /** true when the original was kept (non-raster, tiny, or optimization not worth it) */
  skipped: boolean;
}

// Formats worth re-encoding. GIF (animation) and SVG (vector) pass through.
const RASTER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/bmp', 'image/tiff']);

const swapExt = (name: string, ext: string) => name.replace(/\.[^.]+$/, '') + '.' + ext;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap honours EXIF rotation from phone cameras.
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
      img.src = url;
    });
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export async function optimizeImage(file: File, opts: OptimizeOptions = {}): Promise<OptimizeResult> {
  const { maxDim = 1600, quality = 0.82 } = opts;
  const keepOriginal: OptimizeResult = {
    file, originalBytes: file.size, optimizedBytes: file.size, skipped: true,
  };

  if (!RASTER_TYPES.has(file.type)) return keepOriginal;

  try {
    const img = await decode(file);
    const w = img.width;
    const h = img.height;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return keepOriginal;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, outW, outH);
    if ('close' in img) img.close();

    // Prefer WebP; Safari < 17 silently encodes PNG instead — detect and fall back to JPEG.
    let blob = await toBlob(canvas, 'image/webp', quality);
    if (!blob || blob.type !== 'image/webp') {
      blob = await toBlob(canvas, 'image/jpeg', Math.min(quality + 0.03, 0.9));
    }
    if (!blob) return keepOriginal;

    // Not worth it (already small/optimized and no downscale happened) — keep original.
    if (scale === 1 && blob.size >= file.size) return keepOriginal;

    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const optimized = new File([blob], swapExt(file.name, ext), { type: blob.type });
    return { file: optimized, originalBytes: file.size, optimizedBytes: optimized.size, skipped: false };
  } catch {
    return keepOriginal;
  }
}

/** "3.4 MB → 412 KB" — for upload feedback toasts. */
export function formatSavings(r: OptimizeResult): string {
  const fmt = (b: number) =>
    b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
  return `${fmt(r.originalBytes)} → ${fmt(r.optimizedBytes)}`;
}
