/**
 * Low-power silkscreen WebGL helper.
 * Safety: no idle loop, hard RAF/time caps, tiny textures, one context.
 */

export const CREAM_RGB = [250 / 255, 246 / 255, 233 / 255] as const;

const MAX_TEX = 768;
const MAX_CANVAS_W = 960;
const MAX_CANVAS_H = 540;
const MAX_ANIM_FRAMES = 52;
const MAX_ANIM_MS = 900;
const SETTLE = 0.01;
const PRINT_STEP = 1 / 36;
const MORPH_STEP = 1 / 30;
const TAIL_STEP = 1 / 64;

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

  varying vec2 vUv;

  const vec3 CREAM = vec3(0.980392, 0.964706, 0.913725);
  const vec3 INK = vec3(0.0);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  vec2 coverUv(vec2 uv, vec2 res, vec2 texSize) {
    float screenAspect = res.x / max(res.y, 1.0);
    float texAspect = texSize.x / max(texSize.y, 1.0);
    vec2 scaled = uv;
    if (screenAspect > texAspect) {
      float s = texAspect / screenAspect;
      scaled.y = (uv.y - 0.5) * s + 0.5;
    } else {
      float s = screenAspect / texAspect;
      scaled.x = (uv.x - 0.5) * s + 0.5;
    }
    return scaled;
  }

  float plate(sampler2D tex, vec2 uv, vec2 res, vec2 texSize) {
    vec2 cuv = coverUv(uv, res, texSize);
    if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) {
      return 1.0;
    }
    float luma = dot(texture2D(tex, cuv).rgb, vec3(0.299, 0.587, 0.114));
    return clamp((luma - 0.48) * 1.55 + 0.5, 0.0, 1.0);
  }

  float inkFrom(float luma, float n) {
    float ink = (1.0 - luma) * 0.94;
    ink *= 0.84 + n * 0.22;
    if (n < 0.035) ink = 0.0;
    return ink;
  }

  float stamp(vec2 local, float ink) {
    float radius = ink * 0.5;
    if (radius < 0.02) return 0.0;
    float d = length(local * vec2(1.0, 1.08));
    return step(d, radius);
  }

  void main() {
    float show = max(uHasA, uHasB);
    if (show < 0.5) {
      gl_FragColor = vec4(CREAM, 1.0);
      return;
    }

    float a = uHasA > 0.5 ? plate(uTexA, vUv, uRes, uSizeA) : 1.0;
    float b = uHasB > 0.5 ? plate(uTexB, vUv, uRes, uSizeB) : 1.0;

    float cellPx = 2.75;
    vec2 grid = gl_FragCoord.xy / cellPx;
    vec2 cell = floor(grid);
    vec2 local = fract(grid) - 0.5;
    float n = hash(cell);
    float n2 = hash(cell + vec2(19.1, 7.7));
    float n3 = hash(cell + vec2(3.3, 31.9));

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

    vec2 localA = local + (vec2(n, n2) - 0.5) * 0.08;
    vec2 localB = local + (vec2(n2, n3) - 0.5) * 0.18;

    float inkA = inkFrom(a, n);
    float inkB = inkFrom(b, n);
    if (n3 < 0.045) inkB = 0.0;
    if (n2 > 0.94) inkB *= 1.2;

    float markA = stamp(localA, inkA);
    float markB = stamp(localB, inkB);
    float ghost = step(0.9, n) * stamp(localB + vec2(0.2, -0.14), inkB * 0.55);

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

    float grain = (hash(gl_FragCoord.xy * 0.37) - 0.5) * 0.03;
    vec3 paper = CREAM + grain;
    gl_FragColor = vec4(mix(paper, INK, printed), 1.0);
  }
`;

export type SilkscreenEngine = {
  setTarget: (url: string | null) => void;
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
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function fitCanvas(canvas: HTMLCanvasElement) {
  const scale = Math.min(
    1,
    MAX_CANVAS_W / Math.max(window.innerWidth, 1),
    MAX_CANVAS_H / Math.max(window.innerHeight, 1),
  );
  const w = Math.max(1, Math.floor(window.innerWidth * scale));
  const h = Math.max(1, Math.floor(window.innerHeight * scale));
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA ?? empty);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texB ?? empty);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const settle = () => {
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
    setBusy(false);
  };

  const tick = (now: number) => {
    raf = 0;
    if (disposed || !pageVisible) return;
    frames += 1;
    if (frames === 1) animStarted = now;
    const delta = target - progress;
    const timedOut = now - animStarted > MAX_ANIM_MS;
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
    if (busy && Math.abs(target - progress) > SETTLE) {
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
      if (disposed) return;
      if (busy) {
        pending = url;
        prefetchTarget(url);
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
