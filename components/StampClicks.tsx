"use client";

import { useEffect } from "react";
import { bindStampClicks } from "@/lib/click-sound";

/** Site-wide: any button or link click plays the lo-fi tick. */
export function StampClicks() {
  useEffect(() => bindStampClicks(), []);
  return null;
}
