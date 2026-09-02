/** Shared geometry and timing for the home-to-partner module morph. */
export const STAMP_BOX_W = 335;
/** Standard US business card: 3.5:2, equivalently 7:4. */
export const STAMP_BOX_ASPECT_RATIO = 7 / 4;
export const STAMP_BOX_H = STAMP_BOX_W / STAMP_BOX_ASPECT_RATIO;
/** Information retains its finalized module height. */
export const INFO_BOX_H = 138;
/** StampBox uses `inset-4` inside the shared 7:4 card. */
export const STAMP_INSET = 16;
export const STAMP_ART_W = STAMP_BOX_W - STAMP_INSET * 2;
export const STAMP_ART_H = STAMP_BOX_H - STAMP_INSET * 2;
/** Header and boxed-row height: 40px minus 1px top and 3px bottom. */
export const ROW_H = 36;
/** Partners header and partner name rows. */
export const PARTNER_ROW_H = 32;
/** Top + bottom 0.75px strokes; height is border-box so this must be included. */
export const BOX_BORDER = 1.5;

export function partnersOpenHeight(count: number) {
  return PARTNER_ROW_H * (1 + count) + BOX_BORDER;
}

export const MORPH_MS = 90;
export const MORPH_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Route morphs advance in four printed frames, two intro beats total. */
export const ROUTE_MORPH_MS = 168;
export const ROUTE_MORPH_EASE = "steps(4, jump-end)";
export const LOGO_HOLD_MS = 42;
