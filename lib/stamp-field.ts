import { stampBoxSize, type StampInk } from "@/lib/silkscreen-gl";

/** Mail-art pad colours: office rubber-stamp inks, muted for cream stock. */
export const STAMP_INKS: StampInk[] = [
  [0.11, 0.11, 0.1], // ink black
  [0.78, 0.19, 0.14], // vermilion
  [0.1, 0.51, 0.46], // teal
  [0.16, 0.24, 0.55], // ultramarine
  [0.4, 0.27, 0.55], // violet
  [0.16, 0.31, 0.22], // forest
  [0.71, 0.5, 0.16], // ochre
];

/** Ink squeeze-out needs a little room outside the art box. */
export const STAMP_PAD = 10;

export type StampPlacement = {
  slug: string;
  name: string;
  src: string;
  /** Centre in CSS px. */
  x: number;
  y: number;
  /** Logo art size in CSS px, before rotation. */
  w: number;
  h: number;
  /** Clockwise, degrees. */
  angle: number;
  ink: StampInk;
  seed: number;
  pressure: number;
};

export type StampLogo = {
  slug: string;
  name: string;
  src: string;
  aspect: number;
};

/** Small deterministic PRNG so a field can be replayed from its seed. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Rubber stamps land at whatever angle the hand happened to hold: mostly a
 * crooked tilt, sometimes sideways, sometimes flat upside down.
 */
function pickAngle(rand: () => number) {
  const roll = rand();
  const jitter = (rand() - 0.5) * 34;
  if (roll < 0.52) return jitter * 1.4;
  if (roll < 0.72) return 180 + jitter;
  if (roll < 0.87) return 90 + jitter;
  return 270 + jitter;
}

/** Roughly one stamp per this much viewport area. */
const AREA_PER_STAMP = 74000;
/** Idle stamping is pointless once the modules cover the whole page. */
const MIN_WIDTH = 700;
const MIN_HEIGHT = 380;
/** How far a stamp can wander from its cell, as a share of the cell. */
const CELL_JITTER = 0.95;
const SIZE_SCALE = 0.85;

/**
 * A die is cut once, so every impression of a brand is the same size. Each
 * logo is contain-fitted into one shared frame, tall marks and wide wordmarks
 * landing at matched visual weight.
 */
function artSize(logo: StampLogo, base: number) {
  const frameW = base * SIZE_SCALE;
  const frameH = base * SIZE_SCALE * 0.8;
  const aspect = Math.max(logo.aspect, 0.05);
  let w = frameW;
  let h = w / aspect;
  if (h > frameH) {
    h = frameH;
    w = h * aspect;
  }
  return { w, h };
}

type PlanOptions = {
  logos: StampLogo[];
  width: number;
  height: number;
  seed: number;
};

/**
 * Scatters logos over a shuffled, jittered grid: even coverage of the page,
 * but crooked and clustered enough to read as a hand working across a sheet.
 */
export function planStampField({
  logos,
  width,
  height,
  seed,
}: PlanOptions): StampPlacement[] {
  if (!logos.length || width < MIN_WIDTH || height < MIN_HEIGHT) return [];

  const rand = mulberry32(seed);
  const count = Math.max(
    8,
    Math.min(20, Math.round((width * height) / AREA_PER_STAMP)),
  );
  const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellW = width / cols;
  const cellH = height / rows;
  const base = Math.max(110, Math.min(260, Math.min(cellW, cellH) * 0.82));

  const cells: number[] = [];
  for (let i = 0; i < cols * rows; i += 1) cells.push(i);
  for (let i = cells.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const placed: StampPlacement[] = [];
  const inks = STAMP_INKS;
  const inkedBefore = new Map<string, Set<number>>();
  let inkIndex = Math.floor(rand() * inks.length);
  let logoIndex = Math.floor(rand() * logos.length);

  for (let i = 0; i < Math.min(count, cells.length); i += 1) {
    // Jump the list so the same brand never lands twice in a row.
    logoIndex =
      (logoIndex + 1 + Math.floor(rand() * Math.max(1, logos.length - 1))) %
      logos.length;
    const logo = logos[logoIndex];

    // A repeat impression reads as a fresh pad, so give the brand a colour it
    // has not used on this sheet until the palette runs out.
    let used = inkedBefore.get(logo.slug);
    if (!used) {
      used = new Set<number>();
      inkedBefore.set(logo.slug, used);
    }
    if (used.size >= inks.length) used.clear();
    inkIndex = (inkIndex + 1 + Math.floor(rand() * 2)) % inks.length;
    for (let tries = 0; tries < inks.length && used.has(inkIndex); tries += 1) {
      inkIndex = (inkIndex + 1) % inks.length;
    }
    used.add(inkIndex);

    const { w, h } = artSize(logo, base);
    const angle = pickAngle(rand);
    const box = stampBoxSize(w, h, angle, STAMP_PAD);
    const cell = cells[i];
    const cx = (cell % cols) * cellW + cellW / 2;
    const cy = Math.floor(cell / cols) * cellH + cellH / 2;

    // Loose enough to crowd and overprint neighbours, and to hang off the
    // sheet edge the way a real stamp does.
    const overX = box.w * 0.22;
    const overY = box.h * 0.22;
    const x = Math.min(
      Math.max(cx + (rand() - 0.5) * cellW * CELL_JITTER, box.w / 2 - overX),
      width - box.w / 2 + overX,
    );
    const y = Math.min(
      Math.max(cy + (rand() - 0.5) * cellH * CELL_JITTER, box.h / 2 - overY),
      height - box.h / 2 + overY,
    );

    placed.push({
      slug: logo.slug,
      name: logo.name,
      src: logo.src,
      x,
      y,
      w,
      h,
      angle,
      ink: inks[inkIndex],
      seed: rand(),
      pressure: rand(),
    });
  }

  return placed;
}
