"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  getSilkscreenPrinter,
} from "@/lib/silkscreen-gl";
import {
  cardLogoTransform,
  CENTERED_CARD_LOGO_PLACEMENT,
  type CardLogoPlacement,
} from "@/lib/card-logo-placement";
import { STAMP_ART_H, STAMP_ART_W } from "@/lib/morph";

const DPR_CAP = 1.25;

type StampBoxProps = {
  src: string;
  alt: string;
  placement?: CardLogoPlacement;
  visible?: boolean;
  blend?: boolean;
  source?: HTMLCanvasElement | null;
};

/** Halftone partner stamp, crooked like a rubber stamp, fitted to the module. */
export function StampBox({
  src,
  alt,
  placement = CENTERED_CARD_LOGO_PLACEMENT,
  visible = true,
  blend = true,
  source = null,
}: StampBoxProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printedSrc = useRef<string | null>(null);
  const [ready, setReady] = useState(source != null);
  const [fallback, setFallback] = useState(false);
  const [box, setBox] = useState<{ w: number; h: number }>({
    w: STAMP_ART_W,
    h: STAMP_ART_H,
  });
  const transform = useMemo(
    () => cardLogoTransform(placement, box.w, box.h),
    [placement, box],
  );

  useLayoutEffect(() => {
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

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || fallback) return;

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const tw = Math.max(1, Math.round(box.w * dpr));
    const th = Math.max(1, Math.round(box.h * dpr));

    const draw = (drawable: CanvasImageSource) => {
      const size = drawable as { width?: number; height?: number };
      if (!size.width || !size.height) return false;
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(drawable, 0, 0);
        canvas.style.opacity = "1";
        return true;
      } catch {
        return false;
      }
    };

    if (source && draw(source)) {
      printedSrc.current = src;
      return;
    }

    const printer = getSilkscreenPrinter();
    if (!printer) {
      queueMicrotask(() => setFallback(true));
      return;
    }

    const finished = printer.peekStamp?.(src, tw, th, 1);
    if (finished && draw(finished)) {
      printedSrc.current = src;
      return;
    }

    printedSrc.current = src;
    let cancelled = false;

    void (async () => {
      const drawable = await printer.copyStamp(src, tw, th, 1, true);
      if (cancelled) return;
      if (!drawable) {
        setFallback(true);
        return;
      }
      if (!draw(drawable)) {
        setFallback(true);
        return;
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [src, box, fallback, source]);

  return (
    <div
      ref={wrapRef}
      className={`pointer-events-none absolute inset-4 ${
        blend ? "mix-blend-multiply" : ""
      } ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ transform }}
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
            className={`h-full w-full ${
              ready || source ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>
    </div>
  );
}
