/** Shared geometry and timing for the home-to-partner module morph. */
export const STAMP_BOX_H = 138;
export const ROW_H = 40;
/** Top + bottom 0.75px strokes; height is border-box so this must be included. */
export const BOX_BORDER = 1.5;

export function partnersOpenHeight(count: number) {
  return ROW_H * (1 + count) + BOX_BORDER;
}

export const MORPH_MS = 180;
export const MORPH_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Partner rows peel off one at a time while the module slides shut. */
export const ITEM_STAGGER_MS = 14;
/** Going to a partner: rows leave faster than they return. */
export const ITEM_STAGGER_OUT_MS = 6;
export const HEADER_OFF_MS = 12;
export const LOGO_HOLD_MS = 140;
