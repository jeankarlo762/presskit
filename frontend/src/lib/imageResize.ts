/**
 * Every image the artist uploads is normalised in the browser before the
 * PUT to storage: resized to what its slot needs (and center-cropped when
 * the slot has a fixed shape), re-encoded as WebP, and never larger than
 * the slot's pixel budget. The public page then always gets a predictable
 * file — no 12 MB phone photo as an avatar, no 4:3 cover in a 16:9 hero.
 */
export type ImageKind = "avatar" | "cover" | "logo" | "background" | "section-bg" | "gallery";

type Spec = {
  width: number;
  height: number;
  /** "cover" crops to the exact width×height; "contain" only shrinks to fit. */
  fit: "cover" | "contain";
  /** Keep transparency (logos). Falls back to PNG where WebP can't be encoded. */
  alpha?: boolean;
  quality: number;
};

export const IMAGE_SPECS: Record<ImageKind, Spec> = {
  avatar: { width: 800, height: 800, fit: "cover", quality: 0.86 },
  cover: { width: 1600, height: 900, fit: "cover", quality: 0.85 },
  logo: { width: 1200, height: 400, fit: "contain", alpha: true, quality: 0.9 },
  background: { width: 1920, height: 1920, fit: "contain", quality: 0.82 },
  "section-bg": { width: 1920, height: 1920, fit: "contain", quality: 0.82 },
  gallery: { width: 2000, height: 2000, fit: "contain", quality: 0.86 },
};

export class UnreadableImageError extends Error {
  constructor() {
    super("Não foi possível ler a imagem — envie um JPG, PNG ou WebP");
    this.name = "UnreadableImageError";
  }
}

export type PreparedImage = { file: File; width: number; height: number; extension: string };

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // "from-image" applies the EXIF rotation so phone photos come out upright.
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to the <img> path (older Safari, odd files)
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new UnreadableImageError());
    };
    img.src = url;
  });
}

function sizeOf(source: ImageBitmap | HTMLImageElement) {
  return "naturalWidth" in source
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Resizes/crops `file` for `kind` and returns the file to upload plus its
 * final pixel size. Already-small images still get re-encoded, so the
 * output format is uniform. */
export async function prepareImage(file: File, kind: ImageKind): Promise<PreparedImage> {
  const spec = IMAGE_SPECS[kind];
  const source = await decode(file);
  const { width: sw, height: sh } = sizeOf(source);
  if (!sw || !sh) throw new UnreadableImageError();

  let targetW: number;
  let targetH: number;
  let sx = 0;
  let sy = 0;
  let cropW = sw;
  let cropH = sh;

  if (spec.fit === "cover") {
    const scale = Math.max(spec.width / sw, spec.height / sh);
    // Never upscale a small image: crop to the right shape at its own size.
    const factor = Math.min(1, scale);
    cropW = Math.round(spec.width / scale);
    cropH = Math.round(spec.height / scale);
    sx = Math.round((sw - cropW) / 2);
    sy = Math.round((sh - cropH) / 2);
    targetW = Math.round(cropW * (scale * factor));
    targetH = Math.round(cropH * (scale * factor));
  } else {
    const scale = Math.min(1, spec.width / sw, spec.height / sh);
    targetW = Math.round(sw * scale);
    targetH = Math.round(sh * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, targetW);
  canvas.height = Math.max(1, targetH);
  const ctx = canvas.getContext("2d", { alpha: Boolean(spec.alpha) });
  if (!ctx) throw new UnreadableImageError();
  if (!spec.alpha) {
    // Transparent PNGs on a non-alpha slot get a neutral backdrop instead of black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  let blob = await toBlob(canvas, "image/webp", spec.quality);
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob(canvas, spec.alpha ? "image/png" : "image/jpeg", spec.quality);
  }
  if (!blob) throw new UnreadableImageError();

  const extension = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || kind;
  return {
    file: new File([blob], `${baseName}.${extension}`, { type: blob.type }),
    width: canvas.width,
    height: canvas.height,
    extension,
  };
}
