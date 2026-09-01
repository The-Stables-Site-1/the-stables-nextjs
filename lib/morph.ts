/** Shared geometry and timing for the home-to-partner module morph. */
export const STAMP_BOX_W = 335;
export const STAMP_BOX_H = 138;
/** StampBox uses `inset-4` inside the 335×138 module. */
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

/** Partner rows peel off one at a time while the module slides shut. */
export const ITEM_STAGGER_MS = 6;
/** Going to a partner: rows leave faster than they return. */
export const ITEM_STAGGER_OUT_MS = 3;
export const HEADER_OFF_MS = 4;
export const LOGO_HOLD_MS = 36;
