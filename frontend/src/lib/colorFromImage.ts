/**
 * Suggests a presskit palette from a photo: the most present vivid hue
 * becomes the accent, the background is a very dark (or very light) version
 * of the photo's average tone, and the text color is whichever of black /
 * white reads on that background. Runs entirely in the browser on a
 * downscaled copy of the image — no upload, no API.
 */

type Rgb = { r: number; g: number; b: number };

function toHex({ r, g, b }: Rgb): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export type SuggestedPalette = { backgroundColor: string; textColor: string; accentColor: string };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Our /media route answers with Access-Control-Allow-Origin: * so the
    // canvas stays readable.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    image.src = src;
  });
}

export async function suggestPaletteFromImage(src: string, preferDark = true): Promise<SuggestedPalette> {
  const image = await loadImage(src);
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas indisponível");
  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);

  // Hue histogram weighted by saturation — a vivid stage light beats a
  // large grey wall. 24 buckets of 15°.
  const buckets = new Array<number>(24).fill(0);
  const bucketRgb = Array.from({ length: 24 }, () => ({ r: 0, g: 0, b: 0, n: 0 }));
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] ?? 0;
    if (alpha < 128) continue;
    const rgb = { r: data[i] ?? 0, g: data[i + 1] ?? 0, b: data[i + 2] ?? 0 };
    sumR += rgb.r;
    sumG += rgb.g;
    sumB += rgb.b;
    count++;
    const { h, s, l } = rgbToHsl(rgb);
    if (s < 0.25 || l < 0.12 || l > 0.9) continue;
    const bucket = Math.floor(h / 15) % 24;
    const weight = s * (1 - Math.abs(l - 0.5));
    buckets[bucket] = (buckets[bucket] ?? 0) + weight;
    const entry = bucketRgb[bucket]!;
    entry.r += rgb.r * weight;
    entry.g += rgb.g * weight;
    entry.b += rgb.b * weight;
    entry.n += weight;
  }
  if (count === 0) throw new Error("Imagem vazia");

  const average: Rgb = { r: sumR / count, g: sumG / count, b: sumB / count };
  const averageHsl = rgbToHsl(average);

  let accent: Rgb;
  const best = buckets.indexOf(Math.max(...buckets));
  const entry = bucketRgb[best];
  if (entry && entry.n > 0) {
    const vivid = rgbToHsl({ r: entry.r / entry.n, g: entry.g / entry.n, b: entry.b / entry.n });
    // Pull the accent toward a punchy, mid-lightness version of the hue so
    // it works as a button color regardless of how dark the photo is.
    accent = hslToRgb(vivid.h, Math.max(0.6, vivid.s), 0.55);
  } else {
    accent = hslToRgb(averageHsl.h, 0.6, 0.55);
  }

  const background = preferDark
    ? hslToRgb(averageHsl.h, Math.min(0.35, averageHsl.s), 0.07)
    : hslToRgb(averageHsl.h, Math.min(0.25, averageHsl.s), 0.95);
  const textColor = relativeLuminance(background) > 0.4 ? "#111111" : "#fafafa";

  return { backgroundColor: toHex(background), textColor, accentColor: toHex(accent) };
}
