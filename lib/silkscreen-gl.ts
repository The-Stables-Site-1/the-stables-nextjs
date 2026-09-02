/**
 * Low-power silkscreen WebGL helper.
 * Safety: no idle loop, hard RAF/time caps, tiny textures, one context.
 */

import { buildLogoSdf, type LogoSdf } from "@/lib/logo-sdf";

export const CREAM_RGB = [250 / 255, 246 / 255, 233 / 255] as const;

/** Frame ladders shared by the home plates and the partner slideshow. */
export const PRINT_IN = [0.14, 0.32, 0.5, 0.72, 1] as const;
export const PRINT_IN_MS = [28, 64, 38, 72, 42] as const;
export const UNPRINT = [0.68, 0.4, 0.18, 0] as const;
export const UNPRINT_MS = [36, 52, 28, 40] as const;

/** Rubber-stamp press: a starved kiss, then weight, then the full bite. */
export const PRESS_IN = [0.4, 0.72, 1] as const;
export const PRESS_IN_MS = [42, 54, 0] as const;

const MAX_TEX = 1280;
const MAX_CANVAS_W = 1600;
const MAX_CANVAS_H = 1000;
const DPR_CAP = 1.25;
const MAX_ANIM_FRAMES = 52;
const MAX_ANIM_MS = 110;
const SETTLE = 0.01;
const PRINT_STEP = 1 / 4.5;
const MORPH_STEP = 1 / 3.75;
const TAIL_STEP = 1 / 8;

const VERT = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;

  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uProgress;
  uniform vec2 uRes;
  uniform vec2 uSizeA;
  uniform vec2 uSizeB;
  uniform float uHasA;
  uniform float uHasB;
  uniform float uDir;
  uniform float uColor;
  uniform float uInkAlpha;
  uniform float uContain;

  varying vec2 vUv;

  const vec3 CREAM = vec3(0.980392, 0.964706, 0.913725);
  const vec3 INK = vec3(0.0);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float hash3(vec2 p) {
    return fract(sin(dot(p, vec2(269.5, 183.3))) * 331.319);
  }

  vec2 fitUv(vec2 uv, vec2 res, vec2 texSize) {
    float screenAspect = res.x / max(res.y, 1.0);
    float texAspect = texSize.x / max(texSize.y, 1.0);
    vec2 scaled = uv;
    if (uContain > 0.5) {
      if (screenAspect > texAspect) {
        float s = screenAspect / texAspect;
        scaled.x = (uv.x - 0.5) * s + 0.5;
      } else {
        float s = texAspect / screenAspect;
        scaled.y = (uv.y - 0.5) * s + 0.5;
      }
    } else if (screenAspect > texAspect) {
      float s = texAspect / screenAspect;
      scaled.y = (uv.y - 0.5) * s + 0.5;
    } else {
      float s = screenAspect / texAspect;
      scaled.x = (uv.x - 0.5) * s + 0.5;
    }
    return scaled;
  }

  float plate(sampler2D tex, vec2 uv, vec2 res, vec2 texSize) {
    vec2 cuv = fitUv(uv, res, texSize);
    if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) {
      return 1.0;
    }
    float luma = dot(texture2D(tex, cuv).rgb, vec3(0.299, 0.587, 0.114));
    return clamp((luma - 0.04) * 1.12, 0.0, 1.0);
  }

  vec3 photo(sampler2D tex, vec2 uv, vec2 res, vec2 texSize) {
    vec2 cuv = fitUv(uv, res, texSize);
    if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) {
      return CREAM;
    }
    return texture2D(tex, cuv).rgb;
  }

  float inkFrom(float luma, float n) {
    float ink = clamp(1.0 - luma, 0.0, 1.0);
    ink *= mix(0.96, 1.05, n);
    if (n < 0.01) ink = 0.0;
    return ink;
  }

  float stamp(vec2 local, float ink, float n, float n2) {
    float radius = ink * mix(0.48, 0.54, n);
    if (radius < 0.012) return 0.0;
    vec2 warped = local * vec2(0.98 + n * 0.06, 1.04 - n2 * 0.05);
    warped += (vec2(n2, n) - 0.5) * 0.016;
    float d = length(warped);
    float rim = (hash(local * 16.0 + n * 5.0) - 0.5) * 0.028;
    return smoothstep(radius + 0.02 + rim, radius - 0.022 + rim, d);
  }

  float wear(vec2 frag, float n, float mark) {
    if (mark < 0.001) return 0.0;
    float speck = hash(floor(frag) + n);
    float grit = hash(frag * 1.81 + 9.1);
    float holes = step(0.025, speck);
    float thin = mix(0.92, 1.0, grit);
    return mark * holes * mix(thin, 1.0, smoothstep(0.55, 0.95, mark));
  }

  void main() {
    float show = max(uHasA, uHasB);
    if (show < 0.5) {
      gl_FragColor = vec4(CREAM, 1.0);
      return;
    }

    float aPix = uHasA > 0.5 ? plate(uTexA, vUv, uRes, uSizeA) : 1.0;
    float bPix = uHasB > 0.5 ? plate(uTexB, vUv, uRes, uSizeB) : 1.0;

    float cellPx = 1.55;
    vec2 grid = gl_FragCoord.xy / cellPx;
    vec2 cell = floor(grid);
    vec2 local = fract(grid) - 0.5;
    float n = hash(cell);
    float n2 = hash(cell + vec2(19.1, 7.7));
    float n3 = hash3(cell + vec2(3.3, 31.9));
    vec2 cellUv = (cell + 0.5) * cellPx / uRes;

    float along = uDir > 0.0 ? (1.0 - vUv.y) : vUv.y;
    // Discrete choppy passes, then a long tail of late stragglers.
    float raw = clamp(n * 0.55 + along * 0.28 + n2 * 0.17, 0.0, 1.0);
    float pass = floor(raw * 6.0) / 6.0;
    float liftAt = pass * 0.5 + n3 * 0.04;
    float stampAt = liftAt + 0.05 + n2 * 0.1;
    float late = step(0.78, n2);
    float later = step(0.93, n);
    stampAt = mix(stampAt, 0.68 + n * 0.18, late);
    stampAt = mix(stampAt, 0.84 + n3 * 0.14, later);
    liftAt = min(liftAt, stampAt);
    float lifted = step(liftAt, uProgress);
    float stamped = step(stampAt, uProgress);

    float a = mix(aPix, uHasA > 0.5 ? plate(uTexA, cellUv, uRes, uSizeA) : 1.0, 0.35);
    float b = mix(bPix, uHasB > 0.5 ? plate(uTexB, cellUv, uRes, uSizeB) : 1.0, 0.35);

    vec2 localA = local + (vec2(n, n2) - 0.5) * 0.04;
    vec2 localB = local + (vec2(n2, n3) - 0.5) * 0.1;

    float inkA = inkFrom(a, n);
    float inkB = inkFrom(b, n);
    if (n3 < 0.02) inkB = 0.0;
    if (n2 > 0.97) inkB *= 1.08;

    float markA = stamp(localA, inkA, n, n2);
    float markB = stamp(localB, inkB, n2, n3);
    float ghost = step(0.88, n) * stamp(localB + vec2(0.18, -0.12), inkB * 0.5, n3, n);

    float printed;
    if (uHasB < 0.5) {
      printed = markA * stamped;
    } else {
      float dirty = step(0.87, n2);
      printed = max(
        markA * (1.0 - lifted + dirty * (1.0 - stamped)),
        max(markB * stamped, ghost * stamped)
      );
    }
    printed = wear(gl_FragCoord.xy, n, printed);
    float tone = 1.0 - aPix;
    float dither = hash(gl_FragCoord.xy + n);
    float fine = step(dither, tone);
    printed = mix(printed, max(printed, fine), 0.22 * stamped);

    float grain = (hash(gl_FragCoord.xy * 0.37) - 0.5) * 0.02;
    vec3 paper = CREAM + grain;
    vec3 screen = mix(paper, INK, printed);
    vec3 live = uHasA > 0.5 ? photo(uTexA, vUv, uRes, uSizeA) : CREAM;
    float developed = step(0.001, uColor) * step(stampAt, uColor);
    if (uInkAlpha > 0.5) {
      gl_FragColor = vec4(INK, printed);
      return;
    }
    gl_FragColor = vec4(developed > 0.5 ? live : screen, 1.0);
  }
`;

/**
 * Rubber-stamp pass. The logo is a coverage SDF; wear, pressure, and paper
 * grain decide where ink actually transferred. Noise lives in logo-local UV
 * so holes stay put if the mark is scaled or rotated on the page.
 */
const STAMP_FRAG = /* glsl */ `
  precision mediump float;

  uniform sampler2D uSdf;
  uniform vec2 uSdfSize;
  uniform float uSdfPad;
  uniform float uSdfRange;
  uniform vec2 uRes;
  uniform vec2 uArt;
  uniform float uRot;
  uniform float uProgress;
  uniform float uPressure;
  uniform float uSeed;
  uniform float uWear;
  uniform vec2 uPressDir;
  uniform vec2 uPaper;
  uniform vec3 uInk;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 w = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
  }

  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    s += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
    s += a * vnoise(p);
    p *= 2.01;
    a *= 0.5;
    s += a * vnoise(p);
    p *= 2.02;
    a *= 0.5;
    s += a * vnoise(p);
    return s;
  }

  void main() {
    vec2 px = (vUv - 0.5) * uRes;
    float ease = uProgress * uProgress * (3.0 - 2.0 * uProgress);

    float seed2 = hash(vec2(uSeed, 3.17));
    float seed3 = hash(vec2(uSeed, 8.91));
    float wobble = (hash(vec2(uSeed, 0.17)) - 0.5) * 0.0698;
    float cs = cos(uRot + wobble);
    float sn = sin(uRot + wobble);
    vec2 local = vec2(px.x * cs - px.y * sn, px.x * sn + px.y * cs);

    float sx = 1.0 + (seed2 - 0.5) * 0.04;
    float shear = (seed3 - 0.5) * 0.02;
    local = vec2(local.x * sx + local.y * shear, local.y);

    vec2 nrm = local / max(uArt, vec2(1.0));
    local *= 1.0 - 0.02 * dot(nrm, nrm);

    vec2 uvL = local / max(uArt, vec2(1.0)) + 0.5;
    vec2 inner = max(uSdfSize - 2.0 * uSdfPad, vec2(1.0));
    vec2 sdfUv = (uvL * inner + uSdfPad) / uSdfSize;

    float dPx;
    if (sdfUv.x < 0.0 || sdfUv.x > 1.0 || sdfUv.y < 0.0 || sdfUv.y > 1.0) {
      dPx = 64.0;
    } else {
      float enc = texture2D(uSdf, sdfUv).r;
      float dTex = (enc * 2.0 - 1.0) * uSdfRange;
      dPx = dTex * (uArt.x / inner.x);
    }

    vec2 uvIso = (uvL - 0.5) * vec2(1.0, uArt.y / max(uArt.x, 1.0)) + 0.5;
    uvIso += uSeed * 5.3;
    // Edges wobble by a hair; the letterforms themselves stay whole.
    float erode = 0.002 * uArt.x * mix(0.5, 1.5, uWear);
    dPx += (fbm(uvIso * 25.0) - 0.5) * erode;
    dPx -= ease * mix(0.3, 1.4, uPressure);

    float cov = clamp(0.5 - dPx, 0.0, 1.0);

    // Paper tooth (fine) and ink-film thickness (mid), the latter shared
    // with the sheet so neighbouring stamps dry the same way.
    float fine = fbm(uvIso * 70.0);
    float mid = fbm(uvIso * 10.0 + 17.0);
    float np = fbm((px + uPaper) * 0.05 + 31.0);
    mid = mix(mid, np, 0.3);

    float bias = mix(-0.08, 0.16, uWear);
    bias += dot(uPressDir, uvL - 0.5) * 0.22;
    bias += (vnoise(uvL * 1.5 + uSeed * 9.0) - 0.5) * 0.12;
    bias -= (uPressure - 0.5) * 0.12;
    bias += (1.0 - ease) * 0.4;
    bias += (1.0 - smoothstep(0.0, 1.5, max(-dPx, 0.0))) * 0.05;

    // How much ink the die carried here: the film thins where it was dry.
    float rich = smoothstep(0.18 + bias, 0.6 + bias, mid);
    float film = mix(0.45, 1.0, rich);
    film *= mix(0.8, 1.0, smoothstep(0.3 + bias, 0.5 + bias, fine));

    // Pinholes where the paper tooth never met the die. A thin film breaks
    // into speckle rather than fading, so the threshold rises with dryness.
    float hole = step(0.26 + bias + (1.0 - rich) * 0.1, fine);

    // Coverage stays hard; the ink is either on the paper or it isn't.
    float ink = cov * hole;

    // A fuzzy halo of stray dots just outside the contour, like ink that
    // crept into the paper fibres.
    float fringe = clamp(1.0 - dPx / 1.8, 0.0, 1.0) * (1.0 - cov);
    fringe *= step(0.52 + bias, fine);
    ink = max(ink, fringe);
    film *= mix(0.6, 1.0, cov);

    // Pigment obeys Beer-Lambert under the multiply blend: a thinner film
    // lifts the tone but keeps its saturation, instead of washing toward
    // white the way a lowered alpha would.
    float field = vnoise(uvL * 1.4 + uSeed * 4.0);
    vec3 pigment = clamp(uInk * mix(1.04, 0.96, field), 0.002, 1.0);
    vec3 colour = pow(pigment, vec3(mix(0.35, 1.15, film)));
    gl_FragColor = vec4(colour * ink, ink);
  }
`;

export type SilkscreenEngine = {
  setTarget: (url: string | null) => void;
  revealColor: (url: string, onDone?: () => void) => void;
  dispose: () => void;
};

export type SilkscreenOptions = {
  order?: string[];
  onBusy?: (busy: boolean) => void;
};

function directionFor(
  from: string | null,
  to: string,
  order: string[],
): number {
  if (!from) return 1;
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a < 0 || b < 0 || a === b) return 1;
  return b < a ? -1 : 1;
}

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
  label = "shader",
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[gl] ${label} compile`, gl.getShaderInfoLog(shader));
    }
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function fitCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  const cssW = Math.max(1, window.innerWidth);
  const cssH = Math.max(1, window.innerHeight);
  const scale = Math.min(
    1,
    MAX_CANVAS_W / (cssW * dpr),
    MAX_CANVAS_H / (cssH * dpr),
  );
  const w = Math.max(1, Math.floor(cssW * dpr * scale));
  const h = Math.max(1, Math.floor(cssH * dpr * scale));
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w;
  canvas.height = h;
  return true;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = url;
  });
}

function uploadTexture(
  gl: WebGLRenderingContext,
  scratch: HTMLCanvasElement,
  img: HTMLImageElement,
): { tex: WebGLTexture; w: number; h: number } | null {
  const srcW = img.naturalWidth || 1;
  const srcH = img.naturalHeight || 1;
  const scale = Math.min(1, MAX_TEX / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  scratch.width = w;
  scratch.height = h;
  const ctx = scratch.getContext("2d", { alpha: false });
  if (!ctx) return null;
  ctx.fillStyle = "#faf6e9";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, scratch);

  scratch.width = 1;
  scratch.height = 1;

  return { tex, w, h };
}

type SdfUpload = {
  tex: WebGLTexture;
  w: number;
  h: number;
  pad: number;
  range: number;
};

type TextureEntry = {
  tex: WebGLTexture;
  w: number;
  h: number;
  sdf?: SdfUpload;
};

function uploadSdfTexture(
  gl: WebGLRenderingContext,
  sdf: LogoSdf,
): SdfUpload | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    sdf.w,
    sdf.h,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    sdf.data,
  );
  return {
    tex,
    w: sdf.w,
    h: sdf.h,
    pad: sdf.pad,
    range: sdf.range,
  };
}

export function createSilkscreenEngine(
  canvas: HTMLCanvasElement,
  options: SilkscreenOptions = {},
): SilkscreenEngine | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buf = gl.createBuffer();
  if (!buf) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const loc = {
    uTexA: gl.getUniformLocation(program, "uTexA"),
    uTexB: gl.getUniformLocation(program, "uTexB"),
    uProgress: gl.getUniformLocation(program, "uProgress"),
    uRes: gl.getUniformLocation(program, "uRes"),
    uSizeA: gl.getUniformLocation(program, "uSizeA"),
    uSizeB: gl.getUniformLocation(program, "uSizeB"),
    uHasA: gl.getUniformLocation(program, "uHasA"),
    uHasB: gl.getUniformLocation(program, "uHasB"),
    uDir: gl.getUniformLocation(program, "uDir"),
    uColor: gl.getUniformLocation(program, "uColor"),
    uInkAlpha: gl.getUniformLocation(program, "uInkAlpha"),
    uContain: gl.getUniformLocation(program, "uContain"),
  };

  const scratch = document.createElement("canvas");
  const empty = gl.createTexture();
  if (empty) {
    gl.bindTexture(gl.TEXTURE_2D, empty);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      1,
      1,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      new Uint8Array([250, 246, 233]),
    );
  }

  let disposed = false;
  let pageVisible = !document.hidden;
  let raf = 0;
  let frames = 0;
  let animStarted = 0;
  let progress = 0;
  let target = 0;
  let loadGen = 0;
  let currentUrl: string | null = null;
  let texA: WebGLTexture | null = null;
  let texB: WebGLTexture | null = null;
  let sizeA = { w: 1, h: 1 };
  let sizeB = { w: 1, h: 1 };
  let hasA = 0;
  let hasB = 0;
  let dir = 1;
  let resizeTimer = 0;
  let busy = false;
  let unprinting = false;
  let revealingColor = false;
  let colorLocked = false;
  let colorProgress = 0;
  let pendingReveal = false;
  let onRevealDone: (() => void) | null = null;
  let pending: string | null | undefined;
  let prefetch: { url: string; img: HTMLImageElement } | null = null;
  let prefetchGen = 0;
  const order = options.order ?? [];
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const setBusy = (next: boolean) => {
    if (busy === next) return;
    busy = next;
    options.onBusy?.(next);
  };

  const deleteTex = (tex: WebGLTexture | null) => {
    if (tex && tex !== empty) gl.deleteTexture(tex);
  };

  const stopRaf = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    frames = 0;
    animStarted = 0;
  };

  const paint = () => {
    if (disposed || !pageVisible) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(CREAM_RGB[0], CREAM_RGB[1], CREAM_RGB[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1i(loc.uTexA, 0);
    gl.uniform1i(loc.uTexB, 1);
    gl.uniform1f(loc.uProgress, progress);
    gl.uniform2f(loc.uRes, canvas.width, canvas.height);
    gl.uniform2f(loc.uSizeA, sizeA.w, sizeA.h);
    gl.uniform2f(loc.uSizeB, sizeB.w, sizeB.h);
    gl.uniform1f(loc.uHasA, hasA);
    gl.uniform1f(loc.uHasB, hasB);
    gl.uniform1f(loc.uDir, dir);
    gl.uniform1f(loc.uColor, colorProgress);
    gl.uniform1f(loc.uInkAlpha, 0);
    gl.uniform1f(loc.uContain, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA ?? empty);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texB ?? empty);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const finishReveal = () => {
    colorProgress = 1;
    revealingColor = false;
    pendingReveal = false;
    stopRaf();
    paint();
    const done = onRevealDone;
    onRevealDone = null;
    done?.();
  };

  const startColorReveal = () => {
    unprinting = false;
    pending = undefined;
    pendingReveal = false;
    revealingColor = true;
    colorLocked = true;
    setBusy(true);
    finishReveal();
  };

  const settle = () => {
    if (revealingColor) {
      finishReveal();
      return;
    }
    progress = target;
    if (unprinting) {
      unprinting = false;
      stopRaf();
      paint();
      const next = pending;
      pending = undefined;
      if (next) {
        deleteTex(texA);
        deleteTex(texB);
        texA = null;
        texB = null;
        hasA = 0;
        hasB = 0;
        currentUrl = null;
        progress = 0;
        target = 0;
        queueMicrotask(() => {
          if (!disposed) applyTarget(next);
        });
        return;
      }
      actuallyClear();
      return;
    }
    if (target >= 1 && texB) {
      deleteTex(texA);
      texA = texB;
      texB = null;
      sizeA = sizeB;
      hasA = 1;
      hasB = 0;
    }
    if (!texB && hasA) {
      progress = 1;
      target = 1;
    }
    stopRaf();
    paint();
    const next = pending;
    pending = undefined;
    if (next !== undefined) {
      queueMicrotask(() => {
        if (!disposed) applyTarget(next);
      });
      return;
    }
    if (pendingReveal && hasA && !texB) {
      startColorReveal();
      return;
    }
    setBusy(false);
  };

  const tick = (now: number) => {
    raf = 0;
    if (disposed || !pageVisible) return;
    frames += 1;
    if (frames === 1) animStarted = now;
    const timedOut = now - animStarted > MAX_ANIM_MS;
    if (revealingColor) {
      const delta = 1 - colorProgress;
      if (delta <= SETTLE || frames >= MAX_ANIM_FRAMES || timedOut) {
        settle();
        return;
      }
      const step = colorProgress > 0.62 ? TAIL_STEP : PRINT_STEP;
      colorProgress += Math.min(delta, step);
      paint();
      raf = requestAnimationFrame(tick);
      return;
    }
    const delta = target - progress;
    if (Math.abs(delta) <= SETTLE || frames >= MAX_ANIM_FRAMES || timedOut) {
      settle();
      return;
    }
    const base = hasB ? MORPH_STEP : PRINT_STEP;
    const inTail =
      target > progress ? progress > 0.62 : progress < 0.38;
    const step = inTail ? TAIL_STEP : base;
    progress += Math.sign(delta) * Math.min(Math.abs(delta), step);
    paint();
    raf = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (disposed || raf || !pageVisible) return;
    if (reduceMotion) {
      settle();
      return;
    }
    frames = 0;
    animStarted = 0;
    raf = requestAnimationFrame(tick);
  };

  fitCanvas(canvas);
  paint();

  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (disposed) return;
      if (fitCanvas(canvas)) paint();
    }, 160);
  };

  const onVisibility = () => {
    pageVisible = !document.hidden;
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    if (
      busy &&
      (revealingColor
        ? colorProgress < 1 - SETTLE
        : Math.abs(target - progress) > SETTLE)
    ) {
      raf = requestAnimationFrame(tick);
      return;
    }
    paint();
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    stopRaf();
  };

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);

  const dropPrefetch = () => {
    prefetchGen += 1;
    prefetch = null;
  };

  const prefetchTarget = (url: string | null) => {
    dropPrefetch();
    if (!url) return;
    const gen = prefetchGen;
    void loadImage(url)
      .then((img) => {
        if (disposed || gen !== prefetchGen) return;
        prefetch = { url, img };
      })
      .catch(() => {
        if (gen === prefetchGen) prefetch = null;
      });
  };

  const beginTransition = (url: string, img: HTMLImageElement) => {
    const uploaded = uploadTexture(gl, scratch, img);
    if (!uploaded) {
      setBusy(false);
      return;
    }
    if (!hasA || !texA) {
      deleteTex(texA);
      texA = uploaded.tex;
      sizeA = { w: uploaded.w, h: uploaded.h };
      hasA = 1;
      hasB = 0;
    } else {
      deleteTex(texB);
      texB = uploaded.tex;
      sizeB = { w: uploaded.w, h: uploaded.h };
      hasB = 1;
    }
    unprinting = false;
    progress = 0;
    target = 1;
    currentUrl = url;
    frames = 0;
    animStarted = 0;
    kick();
  };

  const actuallyClear = () => {
    unprinting = false;
    dropPrefetch();
    loadGen += 1;
    currentUrl = null;
    stopRaf();
    deleteTex(texA);
    deleteTex(texB);
    texA = null;
    texB = null;
    hasA = 0;
    hasB = 0;
    progress = 0;
    target = 0;
    setBusy(false);
    paint();
  };

  const applyTarget = (url: string | null) => {
    if (disposed) return;
    if (colorLocked && url === null) return;
    if (url === null) {
      if (!hasA || !texA) {
        actuallyClear();
        return;
      }
      setBusy(true);
      unprinting = true;
      deleteTex(texB);
      texB = null;
      hasB = 0;
      currentUrl = null;
      progress = 1;
      target = 0;
      frames = 0;
      animStarted = 0;
      kick();
      return;
    }
    if (url === currentUrl && hasA && !texB) {
      paint();
      if (pendingReveal) {
        startColorReveal();
        return;
      }
      setBusy(false);
      return;
    }

    setBusy(true);
    dir = directionFor(currentUrl, url, order);
    if (prefetch?.url === url) {
      const img = prefetch.img;
      prefetch = null;
      beginTransition(url, img);
      return;
    }
    const gen = ++loadGen;
    void loadImage(url)
      .then((img) => {
        if (disposed || gen !== loadGen) return;
        beginTransition(url, img);
      })
      .catch(() => {
        if (disposed || gen !== loadGen) return;
        setBusy(false);
        const next = pending;
        pending = undefined;
        if (next !== undefined) applyTarget(next);
      });
  };

  return {
    setTarget(url: string | null) {
      if (disposed || revealingColor || colorLocked) return;
      if (busy) {
        pending = url;
        prefetchTarget(url);
        return;
      }
      applyTarget(url);
    },
    revealColor(url: string, onDone?: () => void) {
      if (disposed) {
        onDone?.();
        return;
      }
      colorLocked = true;
      pending = undefined;
      onRevealDone = onDone ?? null;
      if (currentUrl === url && hasA && !texB && !busy && !unprinting) {
        startColorReveal();
        return;
      }
      pendingReveal = true;
      if (busy) {
        if (currentUrl !== url) pending = url;
        return;
      }
      applyTarget(url);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pending = undefined;
      dropPrefetch();
      loadGen += 1;
      stopRaf();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      deleteTex(texA);
      deleteTex(texB);
      deleteTex(empty);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      scratch.width = 1;
      scratch.height = 1;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/** Ink colour as linear-ish 0–1 RGB, matching the shader uniform. */
export type StampInk = readonly [number, number, number];

export type LogoStampOptions = {
  /** Logo art size in device px, before rotation. */
  artW: number;
  artH: number;
  /** Clockwise, degrees. */
  angle: number;
  progress: number;
  /** 0 = starved die, 1 = flooded die. */
  pressure: number;
  seed: number;
  /** 0 = fresh pad, 1 = dry / worn. */
  wear: number;
  /** Unit vector: the heavier side of the press. */
  pressDir: readonly [number, number];
  /** Page offset of this canvas in device px, for shared paper defects. */
  paper: readonly [number, number];
  ink: StampInk;
};

/** Address-card partner stamps intentionally stay black, independent of the field palette. */
export const STAMP_INK_BLACK: StampInk = [0.11, 0.11, 0.1];

/** User-facing wear: 0 fresh pad, 1 dry / eaten. Field and card stamps orbit this. */
export const STAMP_WEAR = 0.24;

const CARD_STAMP_PAD = 8;

function unitHash(input: string, salt = 0) {
  let hash = 2166136261 ^ salt;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function cardStampLook(url: string) {
  const seed = unitHash(url, 1);
  const pressure = 0.42 + unitHash(url, 2) * 0.5;
  const wear = Math.min(
    0.85,
    Math.max(0.15, STAMP_WEAR + (unitHash(url, 3) - 0.5) * 0.36),
  );
  const angle = unitHash(url, 4) * Math.PI * 2;
  return {
    seed,
    pressure,
    wear,
    pressDir: [Math.cos(angle), Math.sin(angle)] as const,
  };
}

/** Device-px canvas a rotated logo needs, including room for ink squeeze-out. */
export function stampBoxSize(
  artW: number,
  artH: number,
  angle: number,
  pad: number,
) {
  const rad = (angle * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  return {
    w: artW * cos + artH * sin + pad * 2,
    h: artW * sin + artH * cos + pad * 2,
  };
}

export type SilkscreenPrinter = {
  peek: (
    url: string,
    progress?: number,
    color?: number,
  ) => ImageBitmap | null;
  print: (
    url: string,
    progress?: number,
    color?: number,
    urgent?: boolean,
  ) => Promise<ImageBitmap | null>;
  printStamp: (
    url: string,
    width: number,
    height: number,
    progress?: number,
    urgent?: boolean,
  ) => Promise<ImageBitmap | null>;
  peekStamp: (
    url: string,
    width: number,
    height: number,
    progress?: number,
  ) => ImageBitmap | null;
  /** Copies a cached stamp into an independently owned, always-drawable canvas. */
  copyStamp: (
    url: string,
    width: number,
    height: number,
    progress?: number,
    urgent?: boolean,
  ) => Promise<HTMLCanvasElement | null>;
  /** Loads and uploads an image up front, reporting its intrinsic size. */
  preload: (url: string) => Promise<{ w: number; h: number } | null>;
  /** Presses one coloured logo straight into a target 2D canvas. */
  stampLogo: (
    target: HTMLCanvasElement,
    url: string,
    options: LogoStampOptions,
  ) => Promise<boolean>;
  dispose: () => void;
};

function frameKey(url: string, progress: number, color: number) {
  return `${url}|${progress.toFixed(2)}|${color.toFixed(2)}`;
}

function stampKey(
  url: string,
  width: number,
  height: number,
  progress: number,
) {
  return `stamp|${url}|${width}x${height}|${progress.toFixed(2)}`;
}

/** One hidden context that stamps a still halftone frame for stacked hover plates. */
export function createSilkscreenPrinter(): SilkscreenPrinter | null {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: true,
    premultipliedAlpha: true,
    failIfMajorPerformanceCaveat: false,
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buf = gl.createBuffer();
  if (!buf) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const loc = {
    uTexA: gl.getUniformLocation(program, "uTexA"),
    uTexB: gl.getUniformLocation(program, "uTexB"),
    uProgress: gl.getUniformLocation(program, "uProgress"),
    uRes: gl.getUniformLocation(program, "uRes"),
    uSizeA: gl.getUniformLocation(program, "uSizeA"),
    uSizeB: gl.getUniformLocation(program, "uSizeB"),
    uHasA: gl.getUniformLocation(program, "uHasA"),
    uHasB: gl.getUniformLocation(program, "uHasB"),
    uDir: gl.getUniformLocation(program, "uDir"),
    uColor: gl.getUniformLocation(program, "uColor"),
    uInkAlpha: gl.getUniformLocation(program, "uInkAlpha"),
    uContain: gl.getUniformLocation(program, "uContain"),
  };

  const stampFs = compile(gl, gl.FRAGMENT_SHADER, STAMP_FRAG, "stamp-frag");
  let stampProgram: WebGLProgram | null = null;
  let stampPos = -1;
  let stampLoc: Record<string, WebGLUniformLocation | null> | null = null;
  if (stampFs) {
    const linked = gl.createProgram();
    if (linked) {
      gl.attachShader(linked, vs);
      gl.attachShader(linked, stampFs);
      gl.linkProgram(linked);
      if (gl.getProgramParameter(linked, gl.LINK_STATUS)) {
        stampProgram = linked;
        stampPos = gl.getAttribLocation(linked, "aPos");
        stampLoc = {
          uSdf: gl.getUniformLocation(linked, "uSdf"),
          uSdfSize: gl.getUniformLocation(linked, "uSdfSize"),
          uSdfPad: gl.getUniformLocation(linked, "uSdfPad"),
          uSdfRange: gl.getUniformLocation(linked, "uSdfRange"),
          uRes: gl.getUniformLocation(linked, "uRes"),
          uArt: gl.getUniformLocation(linked, "uArt"),
          uRot: gl.getUniformLocation(linked, "uRot"),
          uProgress: gl.getUniformLocation(linked, "uProgress"),
          uPressure: gl.getUniformLocation(linked, "uPressure"),
          uSeed: gl.getUniformLocation(linked, "uSeed"),
          uWear: gl.getUniformLocation(linked, "uWear"),
          uPressDir: gl.getUniformLocation(linked, "uPressDir"),
          uPaper: gl.getUniformLocation(linked, "uPaper"),
          uInk: gl.getUniformLocation(linked, "uInk"),
        };
      } else {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[gl] stamp link", gl.getProgramInfoLog(linked));
        }
        gl.deleteProgram(linked);
      }
    }
  }

  const scratch = document.createElement("canvas");
  const empty = gl.createTexture();
  if (empty) {
    gl.bindTexture(gl.TEXTURE_2D, empty);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      1,
      1,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      new Uint8Array([250, 246, 233]),
    );
  }

  let disposed = false;
  const cache = new Map<string, ImageBitmap>();
  const inflight = new Map<string, Promise<ImageBitmap | null>>();
  const textures = new Map<string, TextureEntry>();
  const urgent: Array<() => Promise<void>> = [];
  const background: Array<() => Promise<void>> = [];
  let pumping = false;

  const paint = (
    tex: WebGLTexture,
    w: number,
    h: number,
    progress: number,
    color: number,
    contain = false,
  ) => {
    const ink = color < 0.001;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (ink) gl.clearColor(0, 0, 0, 0);
    else gl.clearColor(CREAM_RGB[0], CREAM_RGB[1], CREAM_RGB[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1i(loc.uTexA, 0);
    gl.uniform1i(loc.uTexB, 1);
    gl.uniform1f(loc.uProgress, progress);
    gl.uniform2f(loc.uRes, canvas.width, canvas.height);
    gl.uniform2f(loc.uSizeA, w, h);
    gl.uniform2f(loc.uSizeB, 1, 1);
    gl.uniform1f(loc.uHasA, 1);
    gl.uniform1f(loc.uHasB, 0);
    gl.uniform1f(loc.uDir, 1);
    gl.uniform1f(loc.uColor, color);
    gl.uniform1f(loc.uInkAlpha, ink ? 1 : 0);
    gl.uniform1f(loc.uContain, contain ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, empty);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const paintStamp = (
    sdf: SdfUpload,
    options: LogoStampOptions,
  ) => {
    if (!stampProgram || !stampLoc) return false;
    gl.useProgram(stampProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(stampPos);
    gl.vertexAttribPointer(stampPos, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1i(stampLoc.uSdf, 0);
    gl.uniform2f(stampLoc.uSdfSize, sdf.w, sdf.h);
    gl.uniform1f(stampLoc.uSdfPad, sdf.pad);
    gl.uniform1f(stampLoc.uSdfRange, sdf.range);
    gl.uniform2f(stampLoc.uRes, canvas.width, canvas.height);
    gl.uniform2f(stampLoc.uArt, options.artW, options.artH);
    gl.uniform1f(stampLoc.uRot, (options.angle * Math.PI) / 180);
    gl.uniform1f(stampLoc.uProgress, options.progress);
    gl.uniform1f(stampLoc.uPressure, options.pressure);
    gl.uniform1f(stampLoc.uSeed, options.seed);
    gl.uniform1f(stampLoc.uWear, options.wear ?? STAMP_WEAR);
    const press = options.pressDir ?? [1, 0];
    const paper = options.paper ?? [0, 0];
    gl.uniform2f(stampLoc.uPressDir, press[0], press[1]);
    gl.uniform2f(stampLoc.uPaper, paper[0], paper[1]);
    gl.uniform3f(
      stampLoc.uInk,
      options.ink[0],
      options.ink[1],
      options.ink[2],
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sdf.tex);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  };

  const snapshot = async (): Promise<ImageBitmap | null> => {
    try {
      return await createImageBitmap(canvas);
    } catch {
      return null;
    }
  };

  const getTexture = async (url: string) => {
    const hit = textures.get(url);
    if (hit) return hit;
    const img = await loadImage(url);
    if (disposed) return null;
    const uploaded = uploadTexture(gl, scratch, img);
    if (!uploaded) return null;
    const entry: TextureEntry = {
      tex: uploaded.tex,
      w: uploaded.w,
      h: uploaded.h,
    };
    textures.set(url, entry);
    return entry;
  };

  const getStampTexture = async (url: string) => {
    let entry = textures.get(url);
    if (entry?.sdf) return entry;
    const img = await loadImage(url);
    if (disposed) return null;
    if (!entry) {
      const uploaded = uploadTexture(gl, scratch, img);
      if (!uploaded) return null;
      entry = { tex: uploaded.tex, w: uploaded.w, h: uploaded.h };
      textures.set(url, entry);
    }
    const started = performance.now();
    const built = buildLogoSdf(img);
    const elapsed = performance.now() - started;
    if (process.env.NODE_ENV !== "production") {
      console.debug(
        `[stamp-sdf] ${url.split("/").pop()} ${elapsed.toFixed(1)}ms`,
      );
    }
    if (!built || disposed) return null;
    const sdf = uploadSdfTexture(gl, built);
    if (!sdf) return null;
    entry.sdf = sdf;
    return entry;
  };

  const actuallyPrint = async (
    url: string,
    progress: number,
    color: number,
  ): Promise<ImageBitmap | null> => {
    if (disposed) return null;
    fitCanvas(canvas);
    try {
      const tex = await getTexture(url);
      if (!tex || disposed) return null;
      paint(tex.tex, tex.w, tex.h, progress, color);
      return await snapshot();
    } catch {
      return null;
    }
  };

  const actuallyPrintStamp = async (
    url: string,
    width: number,
    height: number,
    progress: number,
  ): Promise<ImageBitmap | null> => {
    if (disposed || !stampProgram) return null;
    const w = Math.max(1, Math.min(800, Math.round(width)));
    const h = Math.max(1, Math.min(400, Math.round(height)));
    canvas.width = w;
    canvas.height = h;
    try {
      const tex = await getStampTexture(url);
      if (!tex?.sdf || disposed) return null;
      const innerW = Math.max(1, w - CARD_STAMP_PAD * 2);
      const innerH = Math.max(1, h - CARD_STAMP_PAD * 2);
      const texAspect =
        (tex.sdf.w - tex.sdf.pad * 2) / Math.max(tex.sdf.h - tex.sdf.pad * 2, 1);
      let artW = innerW;
      let artH = innerH;
      const boxAspect = artW / artH;
      if (texAspect > boxAspect) {
        artH = artW / texAspect;
      } else {
        artW = artH * texAspect;
      }
      const look = cardStampLook(url);
      if (
        !paintStamp(tex.sdf, {
          artW,
          artH,
          angle: 0,
          progress,
          pressure: look.pressure,
          seed: look.seed,
          wear: look.wear,
          pressDir: look.pressDir,
          paper: [0, 0],
          ink: STAMP_INK_BLACK,
        })
      ) {
        return null;
      }
      return await snapshot();
    } catch {
      return null;
    }
  };

  const enqueue = (
    key: string,
    runPrint: () => Promise<ImageBitmap | null>,
    urgentJob: boolean,
  ) => {
    const hit = cache.get(key);
    if (hit && hit.width > 0 && hit.height > 0) return Promise.resolve(hit);
    if (hit) cache.delete(key);
    const pending = inflight.get(key);
    if (pending) return pending;
    const job = new Promise<ImageBitmap | null>((resolve) => {
      const run = async () => {
        const src = await runPrint();
        if (src && !disposed) {
          cache.set(key, src);
          resolve(src);
          return;
        }
        src?.close();
        resolve(null);
      };
      if (urgentJob) urgent.push(run);
      else background.push(run);
      pump();
    });
    inflight.set(key, job);
    void job.finally(() => inflight.delete(key));
    return job;
  };

  const pump = () => {
    if (pumping || disposed) return;
    const task = urgent.shift() ?? background.shift();
    if (!task) return;
    pumping = true;
    void task().finally(() => {
      pumping = false;
      pump();
    });
  };

  return {
    peek(url, progress = 1, color = 0) {
      return cache.get(frameKey(url, progress, color)) ?? null;
    },
    peekStamp(url, width, height, progress = 1) {
      const key = stampKey(url, width, height, progress);
      const hit = cache.get(key);
      if (!hit || hit.width <= 0 || hit.height <= 0) {
        if (hit) cache.delete(key);
        return null;
      }
      return hit;
    },
    print(url, progress = 1, color = 0, urgentJob = false) {
      if (disposed) return Promise.resolve(null);
      return enqueue(
        frameKey(url, progress, color),
        () => actuallyPrint(url, progress, color),
        urgentJob,
      );
    },
    printStamp(url, width, height, progress = 1, urgentJob = false) {
      if (disposed) return Promise.resolve(null);
      return enqueue(
        stampKey(url, width, height, progress),
        () => actuallyPrintStamp(url, width, height, progress),
        urgentJob,
      );
    },
    async copyStamp(
      url,
      width,
      height,
      progress = 1,
      urgentJob = false,
    ) {
      const key = stampKey(url, width, height, progress);

      const copy = (source: ImageBitmap) => {
        if (source.width <= 0 || source.height <= 0) return null;
        const owned = document.createElement("canvas");
        owned.width = source.width;
        owned.height = source.height;
        const ctx = owned.getContext("2d");
        if (!ctx) return null;
        try {
          ctx.drawImage(source, 0, 0);
          return owned;
        } catch {
          return null;
        }
      };

      let source = await enqueue(
        key,
        () => actuallyPrintStamp(url, width, height, progress),
        urgentJob,
      );
      if (!source) return null;
      let owned = copy(source);
      if (owned) return owned;

      // A consumer may have retained a cache-owned ImageBitmap past printer
      // disposal. Evict that detached object and render a fresh source once.
      if (cache.get(key) === source) cache.delete(key);
      source = await enqueue(
        key,
        () => actuallyPrintStamp(url, width, height, progress),
        true,
      );
      if (!source) return null;
      owned = copy(source);
      return owned;
    },
    async preload(url) {
      if (disposed || !url) return null;
      try {
        const tex = await getTexture(url);
        return tex ? { w: tex.w, h: tex.h } : null;
      } catch {
        return null;
      }
    },
    async stampLogo(target, url, options) {
      if (disposed || !stampProgram) return false;
      let tex: TextureEntry | null = null;
      try {
        tex = await getStampTexture(url);
      } catch {
        return false;
      }
      if (!tex?.sdf || disposed) return false;

      const innerW = Math.max(tex.sdf.w - tex.sdf.pad * 2, 1);
      const innerH = Math.max(tex.sdf.h - tex.sdf.pad * 2, 1);
      const texAspect = innerW / innerH;
      let artW = Math.max(options.artW, 1);
      let artH = Math.max(options.artH, 1);
      const boxAspect = artW / artH;
      if (texAspect > boxAspect) {
        artH = artW / texAspect;
      } else {
        artW = artH * texAspect;
      }

      // Paint and copy in one synchronous block: the GL canvas is shared.
      const w = Math.max(1, Math.min(1400, Math.round(target.width)));
      const h = Math.max(1, Math.min(1400, Math.round(target.height)));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      if (!paintStamp(tex.sdf, { ...options, artW, artH })) return false;
      const ctx = target.getContext("2d");
      if (!ctx) return false;
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.drawImage(canvas, 0, 0, target.width, target.height);
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const queued = [...urgent.splice(0), ...background.splice(0)];
      queued.forEach((task) => void task());
      cache.forEach((bitmap) => bitmap.close());
      cache.clear();
      inflight.clear();
      textures.forEach((entry) => {
        gl.deleteTexture(entry.tex);
        if (entry.sdf) gl.deleteTexture(entry.sdf.tex);
      });
      textures.clear();
      if (empty) gl.deleteTexture(empty);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      if (stampProgram) gl.deleteProgram(stampProgram);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (stampFs) gl.deleteShader(stampFs);
      scratch.width = 1;
      scratch.height = 1;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

let sharedPrinter: SilkscreenPrinter | null | undefined;

/** One printer for the whole session so home and partner pages share cached frames. */
export function getSilkscreenPrinter(): SilkscreenPrinter | null {
  if (typeof document === "undefined") return null;
  if (sharedPrinter !== undefined) return sharedPrinter;
  sharedPrinter = createSilkscreenPrinter();
  return sharedPrinter;
}

/** Releases cached bitmaps, textures, and the shared WebGL context. */
export function disposeSilkscreenPrinter() {
  sharedPrinter?.dispose();
  sharedPrinter = undefined;
}

/** Latest cached print of this image, preferring a finished plate. */
export function peekPrinted(url: string): ImageBitmap | null {
  const printer = getSilkscreenPrinter();
  if (!printer) return null;
  for (let i = PRINT_IN.length - 1; i >= 0; i -= 1) {
    const hit = printer.peek(url, PRINT_IN[i], 0);
    if (hit) return hit;
  }
  return printer.peek(url, 1, 0);
}
