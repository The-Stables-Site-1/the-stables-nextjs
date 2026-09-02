export type CardLogoPlacement = {
  angle: number;
  scale: number;
  x: number;
  y: number;
};

let homeLogoHandoff: CardLogoPlacement | null = null;

export const CENTERED_CARD_LOGO_PLACEMENT: CardLogoPlacement = {
  angle: 0,
  scale: 1,
  x: 0,
  y: 0,
};

export function isCardLogoPlacement(
  value: CardLogoPlacement | null | undefined,
): value is CardLogoPlacement {
  return Boolean(
    value &&
      Number.isFinite(value.angle) &&
      Number.isFinite(value.scale) &&
      Number.isFinite(value.x) &&
      Number.isFinite(value.y),
  );
}

/** A fresh, normalized placement that can be safely resolved at any card size. */
export function randomCardLogoPlacement(): CardLogoPlacement {
  const magnitude = 4 + Math.random() * 10;
  return {
    angle: Math.random() < 0.5 ? -magnitude : magnitude,
    // Leave some slack after fitting the rotated rectangle so x/y can vary.
    scale: 0.86 + Math.random() * 0.1,
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
  };
}

/** The taller home artwork stays near its largest rotation-safe card fit. */
export function randomHomeLogoPlacement(): CardLogoPlacement {
  const magnitude = 1 + Math.random() * 3;
  return {
    angle: Math.random() < 0.5 ? -magnitude : magnitude,
    scale: 0.96 + Math.random() * 0.03,
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
  };
}

/** Starts one home-logo appearance that can survive the route remount. */
export function beginHomeLogoHandoff() {
  homeLogoHandoff = randomHomeLogoPlacement();
  return homeLogoHandoff;
}

/** The settled home route consumes the placement shown during its transition. */
export function takeHomeLogoHandoff() {
  const placement = isCardLogoPlacement(homeLogoHandoff)
    ? homeLogoHandoff
    : null;
  homeLogoHandoff = null;
  return placement;
}

/**
 * Fits a rotated rectangle inside its box, then spends only the remaining
 * horizontal/vertical slack on translation. The normalized placement stays
 * stable while resize changes the available pixel bounds.
 */
export function cardLogoTransform(
  placement: CardLogoPlacement | null | undefined,
  boxW: number,
  boxH: number,
  artW = boxW,
  artH = boxH,
) {
  const safePlacement = isCardLogoPlacement(placement)
    ? placement
    : CENTERED_CARD_LOGO_PLACEMENT;
  const rad = (safePlacement.angle * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rotatedW = artW * cos + artH * sin;
  const rotatedH = artW * sin + artH * cos;
  const fit = Math.min(
    1,
    boxW / Math.max(rotatedW, 1),
    boxH / Math.max(rotatedH, 1),
  );
  const scale = fit * safePlacement.scale;
  const maxX = Math.max(0, (boxW - rotatedW * scale) / 2);
  const maxY = Math.max(0, (boxH - rotatedH * scale) / 2);
  const x = safePlacement.x * maxX;
  const y = safePlacement.y * maxY;

  return `translate(${x}px, ${y}px) rotate(${safePlacement.angle}deg) scale(${scale})`;
}
