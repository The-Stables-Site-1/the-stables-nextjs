"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getSilkscreenPrinter,
  PRINT_IN,
  PRINT_IN_MS,
} from "@/lib/silkscreen-gl";

const DPR_CAP = 1.25;

function stampAngle(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unit = (hash >>> 0) / 4294967296;
  const mag = 5 + unit * 11;
  return (hash & 1) === 0 ? mag : -mag;
}

function fitScale(deg: number, boxW: number, boxH: number) {
  const rad = (deg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rotW = boxW * cos + boxH * sin;
  const rotH = boxW * sin + boxH * cos;
  return Math.min(boxW / Math.max(rotW, 1), boxH / Math.max(rotH, 1));
}

type StampBoxProps = {
  src: string;
  alt: string;
  visible?: boolean;
  blend?: boolean;
  seed?: string;
};

/** Halftone partner stamp, crooked like a rubber stamp, fitted to the module. */
export function StampBox({
  src,
  alt,
  visible = true,
  blend = true,
  seed,
}: StampBoxProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printedSrc = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const angle = useMemo(() => stampAngle(seed || src), [seed, src]);
  const scale = fitScale(angle, box?.w ?? 303, box?.h ?? 106);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      setBox((prev) => {
        if (prev && Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1) {
          return prev;
        }
        return { w, h };
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !box || fallback) return;
    const printer = getSilkscreenPrinter();
    if (!printer) {
      setFallback(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const tw = Math.max(1, Math.round(box.w * dpr));
    const th = Math.max(1, Math.round(box.h * dpr));
    const animate = printedSrc.current !== src;
    printedSrc.current = src;
    const ladder = animate ? PRINT_IN : ([1] as const);
    let cancelled = false;

    const draw = (bitmap: ImageBitmap) => {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
    };

    void (async () => {
      for (let i = 0; i < ladder.length; i += 1) {
        const bitmap = await printer.printStamp(
          src,
          tw,
          th,
          ladder[i],
          true,
        );
        if (cancelled) return;
        if (!bitmap) {
          setFallback(true);
          return;
        }
        draw(bitmap);
        setReady(true);
        if (i < ladder.length - 1) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, PRINT_IN_MS[i]),
          );
          if (cancelled) return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src, box, fallback]);

  return (
    <div
      ref={wrapRef}
      className={`pointer-events-none absolute inset-4 ${
        blend ? "mix-blend-multiply" : ""
      } ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ transform: `rotate(${angle}deg) scale(${scale})` }}
      >
        {fallback ? (
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain grayscale contrast-[1.6]"
          />
        ) : (
          <canvas
            ref={canvasRef}
            aria-hidden={alt ? undefined : true}
            role={alt ? "img" : undefined}
            aria-label={alt || undefined}
            className={`h-full w-full ${ready ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
    </div>
  );
}
