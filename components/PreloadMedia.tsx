"use client";

import { preload } from "react-dom";
import { STAMP_LOGO_URLS } from "@/lib/media";

/**
 * Warm the stamp-logo cache only. Gallery JPEGs stay off the critical path
 * so home does not decode dozens of photos or spin up WebGL on every route.
 */
export function PreloadMedia() {
  for (const url of STAMP_LOGO_URLS) {
    preload(url, { as: "image" });
  }
  return null;
}
