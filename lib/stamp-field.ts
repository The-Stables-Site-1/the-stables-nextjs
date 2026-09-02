import { STAMP_ART_H, STAMP_ART_W } from "@/lib/morph";
import { STAMP_WEAR, stampBoxSize, type StampInk } from "@/lib/silkscreen-gl";

export { STAMP_WEAR };

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
  wear: number;
  pressDir: readonly [number, number];
};

export type StampLogo = {
  slug: string;
  name: string;
  src: string;
  aspect: number;
};

/** Viewport-space box stamps must not cover — the centre modules. */
export type AvoidRect = {
  x: number;
  y: number;
  w: number;
  h: number;
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
/**
 * Keep-out around the centre column. Negative so stamps can sit in the aside
 * padding and graze the modules — the boxes themselves stay readable.
 */
const AVOID_PAD = -24;
const PLACE_TRIES = 16;

function inflateAvoid(avoid: AvoidRect, pad: number): AvoidRect {
  return {
    x: avoid.x - pad,
    y: avoid.y - pad,
    w: avoid.w + pad * 2,
    h: avoid.h + pad * 2,
  };
}

function boxOverlapsAvoid(
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  avoid: AvoidRect,
) {
  const left = x - boxW / 2;
  const top = y - boxH / 2;
  return (
    left < avoid.x + avoid.w &&
    left + boxW > avoid.x &&
    top < avoid.y + avoid.h &&
    top + boxH > avoid.y
  );
}

/** True when a stamp's rotated ink box intersects the centre container. */
export function stampOverlapsAvoid(
  x: number,
  y: number,
  artW: number,
  artH: number,
  angle: number,
  avoid: AvoidRect,
) {
  const box = stampBoxSize(artW, artH, angle, STAMP_PAD);
  return boxOverlapsAvoid(x, y, box.w, box.h, inflateAvoid(avoid, AVOID_PAD));
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(Math.max(value, min), max);
}

/**
 * If a stamp landed on the centre column, slide it to the nearest free side
 * (or above / below) so the cell is not wasted.
 */
function nudgeOutOfAvoid(
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  avoid: AvoidRect,
  width: number,
  height: number,
  overX: number,
  overY: number,
): { x: number; y: number } | null {
  if (!boxOverlapsAvoid(x, y, boxW, boxH, avoid)) return { x, y };

  const minX = boxW / 2 - overX;
  const maxX = width - boxW / 2 + overX;
  const minY = boxH / 2 - overY;
  const maxY = height - boxH / 2 + overY;

  const candidates: { x: number; y: number }[] = [];
  const leftX = avoid.x - boxW / 2;
  const rightX = avoid.x + avoid.w + boxW / 2;
  const upY = avoid.y - boxH / 2;
  const downY = avoid.y + avoid.h + boxH / 2;

  if (leftX >= minX && leftX <= maxX) candidates.push({ x: leftX, y });
  if (rightX >= minX && rightX <= maxX) candidates.push({ x: rightX, y });
  if (upY >= minY && upY <= maxY) candidates.push({ x, y: upY });
  if (downY >= minY && downY <= maxY) candidates.push({ x, y: downY });

  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (const candidate of candidates) {
    const nx = clamp(candidate.x, minX, maxX);
    const ny = clamp(candidate.y, minY, maxY);
    if (boxOverlapsAvoid(nx, ny, boxW, boxH, avoid)) continue;
    const dist = (nx - x) * (nx - x) + (ny - y) * (ny - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: nx, y: ny };
    }
  }
  return best;
}

/** Same small tilt the partner-page stamp module uses, seeded by the brand name. */
export function stampModuleTilt(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unit = (hash >>> 0) / 4294967296;
  const mag = 5 + unit * 11;
  return (hash & 1) === 0 ? mag : -mag;
}

/** Scale a rotated rectangle so it still sits inside `boxW` × `boxH`. */
export function stampFitScale(deg: number, boxW: number, boxH: number) {
  const rad = (deg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rotW = boxW * cos + boxH * sin;
  const rotH = boxW * sin + boxH * cos;
  return Math.min(boxW / Math.max(rotW, 1), boxH / Math.max(rotH, 1));
}

/** Contain-fit a logo into a frame without stretching. */
export function containArt(aspect: number, frameW: number, frameH: number) {
  const a = Math.max(aspect, 0.05);
  let w = frameW;
  let h = w / a;
  if (h > frameH) {
    h = frameH;
    w = h * a;
  }
  return { w, h };
}

/**
 * Die size matching the partner-page stamp module: contain-fitted into the
 * inner frame, then scaled so the module's slight tilt still sits inside.
 */
export function moduleStampArtSize(aspect: number, seed: string) {
  const fitted = containArt(aspect, STAMP_ART_W, STAMP_ART_H);
  const scale = stampFitScale(
    stampModuleTilt(seed),
    STAMP_ART_W,
    STAMP_ART_H,
  );
  return { w: fitted.w * scale, h: fitted.h * scale };
}

function artSize(logo: StampLogo) {
  return moduleStampArtSize(logo.aspect, logo.name || logo.src);
}

type PlanOptions = {
  logos: StampLogo[];
  width: number;
  height: number;
  seed: number;
  /** Centre content stamps must not cover. */
  avoid?: AvoidRect | null;
};

/**
 * Scatters logos over a shuffled, jittered grid: even coverage of the page,
 * but crooked and clustered enough to read as a hand working across a sheet.
 * Stamps hug the centre modules when `avoid` is set, close enough to graze.
 */
export function planStampField({
  logos,
  width,
  height,
  seed,
  avoid,
}: PlanOptions): StampPlacement[] {
  if (!logos.length || width < MIN_WIDTH || height < MIN_HEIGHT) return [];

  const forbidden = avoid ? inflateAvoid(avoid, AVOID_PAD) : null;
  const blocked =
    forbidden == null
      ? 0
      : Math.max(0, Math.min(forbidden.w, width) * Math.min(forbidden.h, height));
  const usable = Math.max(0, width * height - blocked);

  const rand = mulberry32(seed);
  const count = Math.max(
    8,
    Math.min(20, Math.round((usable || width * height) / AREA_PER_STAMP)),
  );
  const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellW = width / cols;
  const cellH = height / rows;

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

  for (const cell of cells) {
    if (placed.length >= count) break;

    const cx = (cell % cols) * cellW + cellW / 2;
    const cy = Math.floor(cell / cols) * cellH + cellH / 2;

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

    const { w, h } = artSize(logo);
    const angle = pickAngle(rand);
    const box = stampBoxSize(w, h, angle, STAMP_PAD);

    // Loose enough to crowd and overprint neighbours, and to hang off the
    // sheet edge the way a real stamp does.
    const overX = box.w * 0.22;
    const overY = box.h * 0.22;
    const minX = box.w / 2 - overX;
    const maxX = width - box.w / 2 + overX;
    const minY = box.h / 2 - overY;
    const maxY = height - box.h / 2 + overY;

    let x = 0;
    let y = 0;
    let found = false;
    for (let attempt = 0; attempt < PLACE_TRIES; attempt += 1) {
      const nextX = clamp(
        cx + (rand() - 0.5) * cellW * CELL_JITTER,
        minX,
        maxX,
      );
      const nextY = clamp(
        cy + (rand() - 0.5) * cellH * CELL_JITTER,
        minY,
        maxY,
      );
      if (
        forbidden &&
        boxOverlapsAvoid(nextX, nextY, box.w, box.h, forbidden)
      ) {
        continue;
      }
      x = nextX;
      y = nextY;
      found = true;
      break;
    }

    if (!found && forbidden) {
      const seededX = clamp(
        cx + (rand() - 0.5) * cellW * CELL_JITTER,
        minX,
        maxX,
      );
      const seededY = clamp(
        cy + (rand() - 0.5) * cellH * CELL_JITTER,
        minY,
        maxY,
      );
      const nudged = nudgeOutOfAvoid(
        seededX,
        seededY,
        box.w,
        box.h,
        forbidden,
        width,
        height,
        overX,
        overY,
      );
      if (!nudged) continue;
      x = nudged.x;
      y = nudged.y;
      found = true;
    }

    if (!found) continue;

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
      wear: Math.min(0.85, Math.max(0.15, STAMP_WEAR + (rand() - 0.5) * 0.36)),
      pressDir: (() => {
        const a = rand() * Math.PI * 2;
        return [Math.cos(a), Math.sin(a)] as const;
      })(),
    });
  }

  return placed;
}

/**
 * One impression of a specific logo, using the same scatter, tilt, and
 * centre-column avoidance as the idle field.
 */
export function placeOneStamp({
  logo,
  width,
  height,
  seed,
  avoid,
}: {
  logo: StampLogo;
  width: number;
  height: number;
  seed: number;
  avoid?: AvoidRect | null;
}): StampPlacement | null {
  return (
    planStampField({ logos: [logo], width, height, seed, avoid })[0] ?? null
  );
}
