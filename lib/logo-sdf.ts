/**
 * CPU signed-distance field for a logo treated as a coverage mask.
 * 8SSEDT on a padded, contain-fitted bitmap — one pass at upload, then the
 * stamp shader can erode thin strokes instead of punching holes in alpha.
 */

export type LogoSdf = {
  data: Uint8Array;
  w: number;
  h: number;
  pad: number;
  /** Texels mapped to the 0–1 encode range (half the signed span). */
  range: number;
};

const DEFAULT_MAX_SIDE = 512;
const DEFAULT_PAD = 24;
const DEFAULT_RANGE = 10;
const INF = 1e4;
const BINARIZE = 0.5;
/** If this share of inner pixels is fully opaque, treat the image as luma. */
const OPAQUE_FALLBACK = 0.96;

export function buildLogoSdf(
  img: HTMLImageElement,
  maxSide = DEFAULT_MAX_SIDE,
  pad = DEFAULT_PAD,
): LogoSdf | null {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) return null;

  const innerMax = Math.max(8, maxSide - pad * 2);
  const scale = Math.min(innerMax / srcW, innerMax / srcH);
  const artW = Math.max(1, Math.round(srcW * scale));
  const artH = Math.max(1, Math.round(srcH * scale));
  const w = artW + pad * 2;
  const h = artH + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, pad, pad, artW, artH);

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }

  const innerCount = artW * artH;
  let opaque = 0;
  for (let y = pad; y < pad + artH; y += 1) {
    for (let x = pad; x < pad + artW; x += 1) {
      if (pixels[(y * w + x) * 4 + 3] > 250) opaque += 1;
    }
  }
  const useLuma = innerCount > 0 && opaque / innerCount >= OPAQUE_FALLBACK;

  const n = w * h;
  const insideX = new Float32Array(n);
  const insideY = new Float32Array(n);
  const outsideX = new Float32Array(n);
  const outsideY = new Float32Array(n);

  for (let i = 0; i < n; i += 1) {
    const r = pixels[i * 4] / 255;
    const g = pixels[i * 4 + 1] / 255;
    const b = pixels[i * 4 + 2] / 255;
    const a = pixels[i * 4 + 3] / 255;
    const luma = r * 0.299 + g * 0.587 + b * 0.114;
    const coverage = useLuma ? (1 - luma) * a : a;
    const ink = coverage >= BINARIZE;
    if (ink) {
      insideX[i] = 0;
      insideY[i] = 0;
      outsideX[i] = INF;
      outsideY[i] = INF;
    } else {
      insideX[i] = INF;
      insideY[i] = INF;
      outsideX[i] = 0;
      outsideY[i] = 0;
    }
  }

  edt8(insideX, insideY, w, h);
  edt8(outsideX, outsideY, w, h);

  const range = DEFAULT_RANGE;
  const data = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    const dIn = Math.hypot(insideX[i], insideY[i]);
    const dOut = Math.hypot(outsideX[i], outsideY[i]);
    // Negative inside, positive outside — erosion raises d, bleed lowers it.
    const d = dIn - dOut;
    const enc = Math.min(1, Math.max(0, d / range * 0.5 + 0.5));
    data[i] = Math.round(enc * 255);
  }

  canvas.width = 1;
  canvas.height = 1;

  return { data, w, h, pad, range };
}

function edt8(
  dx: Float32Array,
  dy: Float32Array,
  w: number,
  h: number,
) {
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      relax(dx, dy, w, h, x, y, -1, 0);
      relax(dx, dy, w, h, x, y, 0, -1);
      relax(dx, dy, w, h, x, y, -1, -1);
      relax(dx, dy, w, h, x, y, 1, -1);
    }
  }
  for (let y = h - 1; y >= 0; y -= 1) {
    for (let x = w - 1; x >= 0; x -= 1) {
      relax(dx, dy, w, h, x, y, 1, 0);
      relax(dx, dy, w, h, x, y, 0, 1);
      relax(dx, dy, w, h, x, y, -1, 1);
      relax(dx, dy, w, h, x, y, 1, 1);
    }
  }
}

function relax(
  dx: Float32Array,
  dy: Float32Array,
  w: number,
  h: number,
  x: number,
  y: number,
  ox: number,
  oy: number,
) {
  const nx = x + ox;
  const ny = y + oy;
  if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
  const i = y * w + x;
  const n = ny * w + nx;
  const cx = dx[n] + ox;
  const cy = dy[n] + oy;
  if (cx * cx + cy * cy < dx[i] * dx[i] + dy[i] * dy[i]) {
    dx[i] = cx;
    dy[i] = cy;
  }
}
