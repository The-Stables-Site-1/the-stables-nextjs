"use client";

import { useEffect, useRef, useState } from "react";
import { createSilkscreenEngine, type SilkscreenEngine } from "@/lib/silkscreen-gl";

type HeroShaderProps = {
  imageUrl: string | null;
  imageOrder?: string[];
  visible: boolean;
};

export function HeroShader({
  imageUrl,
  imageOrder = [],
  visible,
}: HeroShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SilkscreenEngine | null>(null);
  const orderRef = useRef(imageOrder);
  orderRef.current = imageOrder;
  const [fallback, setFallback] = useState(false);
  const [busy, setBusy] = useState(false);
  const show = Boolean((visible && imageUrl) || busy);

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (fallback) return;

    if (!engineRef.current && !imageUrl) return;

    if (!engineRef.current) {
      const engine = createSilkscreenEngine(canvas, {
        order: orderRef.current,
        onBusy: setBusy,
      });
      if (!engine) {
        setFallback(true);
        return;
      }
      engineRef.current = engine;
    }

    engineRef.current.setTarget(imageUrl);
  }, [imageUrl, fallback]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden bg-cream transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden
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
  );
}
