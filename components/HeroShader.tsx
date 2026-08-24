"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createSilkscreenEngine, type SilkscreenEngine } from "@/lib/silkscreen-gl";

type HeroShaderProps = {
  imageUrl: string | null;
  imageOrder?: string[];
  visible: boolean;
  /** Transform applied to the print plate; the untransformed plate is full-bleed. */
  transform?: string;
  transitionMs?: number;
  easing?: string;
};

export type HeroShaderHandle = {
  revealColor: (url: string, onDone?: () => void) => void;
};

export const HeroShader = forwardRef<HeroShaderHandle, HeroShaderProps>(
  function HeroShader(
    {
      imageUrl,
      imageOrder = [],
      visible,
      transform,
      transitionMs = 0,
      easing = "cubic-bezier(0.22, 1, 0.36, 1)",
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<SilkscreenEngine | null>(null);
    const orderRef = useRef(imageOrder);
    orderRef.current = imageOrder;
    const [fallback, setFallback] = useState(false);
    const [busy, setBusy] = useState(false);
    const show = Boolean((visible && imageUrl) || busy);

    const ensureEngine = () => {
      if (engineRef.current) return engineRef.current;
      const canvas = canvasRef.current;
      if (!canvas || fallback) return null;
      const engine = createSilkscreenEngine(canvas, {
        order: orderRef.current,
        onBusy: setBusy,
      });
      if (!engine) {
        setFallback(true);
        return null;
      }
      engineRef.current = engine;
      return engine;
    };

    useImperativeHandle(ref, () => ({
      revealColor(url, onDone) {
        const engine = ensureEngine();
        if (!engine) {
          onDone?.();
          return;
        }
        engine.revealColor(url, onDone);
      },
    }));

    useEffect(() => {
      return () => {
        engineRef.current?.dispose();
        engineRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (fallback) return;
      if (!engineRef.current && !imageUrl) return;
      const engine = ensureEngine();
      engine?.setTarget(imageUrl);
    }, [imageUrl, fallback]);

    return (
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div
          className={`absolute inset-0 overflow-hidden bg-cream ${
            show ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transform,
            transition: transitionMs
              ? `transform ${transitionMs}ms ${easing}`
              : "none",
            willChange: "transform",
          }}
        >
          <canvas ref={canvasRef} className="h-full w-full" />
          {fallback && imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- WebGL fallback only
            <img
              src={imageUrl}
              alt=""
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover [filter:grayscale(1)_contrast(1.35)] mix-blend-multiply"
            />
          ) : null}
        </div>
      </div>
    );
  },
);
