"use client";

type HeroShaderProps = {
  imageUrl: string | null;
  visible: boolean;
};

/**
 * Hover hero — CSS only (no WebGL / Three.js).
 * Fullscreen WebGL was thrashing the GPU and crashing the machine.
 */
export function HeroShader({ imageUrl, visible }: HeroShaderProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden bg-cream transition-opacity duration-500 ${
        visible && imageUrl ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote blob URLs; avoid next/image + GPU canvas
        <img
          key={imageUrl}
          src={imageUrl}
          alt=""
          decoding="async"
          className="h-full w-full object-cover [filter:grayscale(1)_contrast(1.35)_brightness(1.05)] mix-blend-multiply"
        />
      ) : null}
    </div>
  );
}
