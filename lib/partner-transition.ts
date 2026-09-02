import {
  isCardLogoPlacement,
  randomCardLogoPlacement,
  type CardLogoPlacement,
} from "@/lib/card-logo-placement";
import { STAMP_ART_H, STAMP_ART_W } from "@/lib/morph";
import { getSilkscreenPrinter } from "@/lib/silkscreen-gl";

const DPR_CAP = 1.25;

export type PartnerLogoHandoff = {
  src: string;
  alt: string;
  placement: CardLogoPlacement;
  source: HTMLCanvasElement | null;
};

let activeHandoff: PartnerLogoHandoff | null = null;
let pendingBitmap: Promise<PartnerLogoHandoff> | null = null;

/**
 * Starts one logo presentation for the whole home → partner → home visit.
 * The same placement and rendered bitmap survive the App Router remount.
 */
export async function beginPartnerLogoHandoff(
  src: string,
  alt: string,
): Promise<PartnerLogoHandoff> {
  const handoff: PartnerLogoHandoff = {
    src,
    alt,
    placement: randomCardLogoPlacement(),
    source: null,
  };
  activeHandoff = handoff;

  const printer = getSilkscreenPrinter();
  if (!printer) return handoff;

  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  const width = Math.max(1, Math.round(STAMP_ART_W * dpr));
  const height = Math.max(1, Math.round(STAMP_ART_H * dpr));
  pendingBitmap = printer
    .copyStamp(src, width, height, 1, true)
    .then((source) => {
      if (activeHandoff === handoff) handoff.source = source;
      return handoff;
    });

  return pendingBitmap;
}

export function getPartnerLogoHandoff(src: string) {
  if (activeHandoff?.src !== src) return null;
  // Turbopack can preserve module state whose shape predates this field.
  if (!isCardLogoPlacement(activeHandoff.placement)) {
    activeHandoff.placement = randomCardLogoPlacement();
  }
  return activeHandoff;
}

/** Creates a presentation for a direct partner-page visit. */
export function ensurePartnerLogoHandoff(src: string, alt: string) {
  const current = getPartnerLogoHandoff(src);
  if (current) return pendingBitmap ?? Promise.resolve(current);
  return beginPartnerLogoHandoff(src, alt);
}
