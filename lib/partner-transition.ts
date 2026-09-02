import { STAMP_ART_H, STAMP_ART_W } from "@/lib/morph";
import { getSilkscreenPrinter } from "@/lib/silkscreen-gl";

const DPR_CAP = 1.25;

export type PartnerLogoHandoff = {
  src: string;
  alt: string;
  transform: string;
  source: HTMLCanvasElement | null;
};

let activeHandoff: PartnerLogoHandoff | null = null;
let pendingBitmap: Promise<PartnerLogoHandoff> | null = null;

function randomTransform() {
  const left = Math.round(-8 + Math.random() * 16);
  const top = Math.round(-6 + Math.random() * 12);
  const scale = 1.12 + Math.random() * 0.12;
  return `translate(${left}px, ${top}px) scale(${scale})`;
}

/**
 * Starts one logo presentation for the whole home → partner → home visit.
 * The same transform and rendered bitmap survive the App Router remount.
 */
export async function beginPartnerLogoHandoff(
  src: string,
  alt: string,
): Promise<PartnerLogoHandoff> {
  const handoff: PartnerLogoHandoff = {
    src,
    alt,
    transform: randomTransform(),
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
  return activeHandoff?.src === src ? activeHandoff : null;
}

/** Creates a presentation for a direct partner-page visit. */
export function ensurePartnerLogoHandoff(src: string, alt: string) {
  const current = getPartnerLogoHandoff(src);
  if (current) return pendingBitmap ?? Promise.resolve(current);
  return beginPartnerLogoHandoff(src, alt);
}
