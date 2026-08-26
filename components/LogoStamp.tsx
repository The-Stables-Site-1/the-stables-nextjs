"use client";

import { useEffect, useRef, useState } from "react";
import {
  getSilkscreenPrinter,
  PRESS_IN,
  PRESS_IN_MS,
  stampBoxSize,
} from "@/lib/silkscreen-gl";
import { STAMP_PAD, type StampPlacement } from "@/lib/stamp-field";

const DPR_CAP = 1.25;
/** Erosion fleck size in device px — chunky enough to read as broken ink. */
const GRAIN = 1.9;

function devicePixelRatio() {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, DPR_CAP);
}

type LogoStampProps = {
  placement: StampPlacement;
};

/** One partner logo pressed onto the page in coloured, eroded ink. */
export function LogoStamp({ placement }: LogoStampProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const dpr = devicePixelRatio();
  const box = stampBoxSize(placement.w, placement.h, placement.angle, STAMP_PAD);
  const pixelW = Math.max(1, Math.round(box.w * dpr));
  const pixelH = Math.max(1, Math.round(box.h * dpr));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const printer = getSilkscreenPrinter();
    if (!printer) return;

    let cancelled = false;

    void (async () => {
      for (let i = 0; i < PRESS_IN.length; i += 1) {
        const ok = await printer.stampLogo(canvas, placement.src, {
          artW: placement.w * dpr,
          artH: placement.h * dpr,
          angle: placement.angle,
          progress: PRESS_IN[i],
          pressure: placement.pressure,
          seed: placement.seed,
          grain: GRAIN * dpr,
          ink: placement.ink,
        });
        if (cancelled || !ok) return;
        setReady(true);
        const hold = PRESS_IN_MS[i];
        if (hold) {
          await new Promise((resolve) => window.setTimeout(resolve, hold));
          if (cancelled) return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [placement, dpr]);

  return (
    <div
      className="absolute mix-blend-multiply"
      style={{
        left: placement.x - box.w / 2,
        top: placement.y - box.h / 2,
        width: box.w,
        height: box.h,
      }}
    >
      <canvas
        ref={canvasRef}
        width={pixelW}
        height={pixelH}
        aria-hidden
        className={`h-full w-full ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
