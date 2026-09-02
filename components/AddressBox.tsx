"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { StampBox } from "@/components/StampBox";
import {
  cardLogoTransform,
  CENTERED_CARD_LOGO_PLACEMENT,
  randomHomeLogoPlacement,
  type CardLogoPlacement,
} from "@/lib/card-logo-placement";
import { STAMP_BOX_ASPECT_RATIO, STAMP_BOX_H } from "@/lib/morph";
import type { PartnerLogoHandoff } from "@/lib/partner-transition";
import { brandStampLogo } from "@/lib/partners";

const HOME_STAMP_SCALE = 1.5 * 0.85;
// Dark-pixel bounds of brand/stamp-logo.png (measured from the 640×480 asset).
// The opaque white margin multiplies away, so placement must bound the ink.
const HOME_STAMP_INK = {
  centerX: (82 + 482 / 2) / 640,
  centerY: (131 + 198 / 2) / 480,
  width: 482 / 640,
  height: 198 / 480,
};

type AddressBoxProps = {
  showLogo?: boolean;
  /** Replaces The Stables artwork without replacing or moving this module. */
  logo?: { src: string; alt: string };
  opaque?: boolean;
  href?: string;
  onBack?: () => void;
  logoHandoff?: PartnerLogoHandoff | null;
  homeLogoPlacement?: CardLogoPlacement | null;
};

export function AddressBox({
  showLogo = true,
  logo,
  opaque = false,
  href,
  onBack,
  logoHandoff = null,
  homeLogoPlacement = null,
}: AddressBoxProps) {
  const logoFrameRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const logoImageRef = useRef<HTMLImageElement>(null);
  const partnerLogoRef = useRef<HTMLDivElement>(null);
  const displayedLogo =
    logo ??
    (logoHandoff
      ? { src: logoHandoff.src, alt: logoHandoff.alt }
      : undefined);
  const partnerLogoSrc = logo?.src;

  useLayoutEffect(() => {
    const frame = logoFrameRef.current;
    const stablesLogo = logoRef.current;
    const image = logoImageRef.current;
    if (!frame || !stablesLogo || !image) return;
    stablesLogo.style.opacity = "0";
    if (!showLogo || partnerLogoSrc) return;

    const placement = homeLogoPlacement ?? randomHomeLogoPlacement();
    const position = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const frameW = frame.clientWidth;
      const frameH = frame.clientHeight;
      const fit = Math.min(
        frameW / image.naturalWidth,
        frameH / image.naturalHeight,
      );
      // Unlike partner canvases, size this element to the home artwork's
      // actual ink bounds; its large opaque white margin multiplies away.
      const imageW = image.naturalWidth * fit * HOME_STAMP_SCALE;
      const imageH = image.naturalHeight * fit * HOME_STAMP_SCALE;
      const inkW = imageW * HOME_STAMP_INK.width;
      const inkH = imageH * HOME_STAMP_INK.height;
      stablesLogo.style.width = `${imageW}px`;
      stablesLogo.style.height = `${imageH}px`;
      stablesLogo.style.left =
        `${frameW / 2 - imageW * HOME_STAMP_INK.centerX}px`;
      stablesLogo.style.top =
        `${frameH / 2 - imageH * HOME_STAMP_INK.centerY}px`;
      stablesLogo.style.transformOrigin =
        `${HOME_STAMP_INK.centerX * 100}% ${HOME_STAMP_INK.centerY * 100}%`;
      stablesLogo.style.transform = cardLogoTransform(
        placement,
        frameW,
        frameH,
        inkW,
        inkH,
      );
      stablesLogo.style.opacity = "1";
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(frame);
    image.addEventListener("load", position);
    return () => {
      observer.disconnect();
      image.removeEventListener("load", position);
    };
  }, [homeLogoPlacement, partnerLogoSrc, showLogo]);

  useLayoutEffect(() => {
    const partnerLogo = partnerLogoRef.current;
    if (!partnerLogo) return;
    partnerLogo.style.opacity = "0";
    if (
      !partnerLogoSrc ||
      !showLogo ||
      logoHandoff?.src !== partnerLogoSrc
    ) {
      return;
    }

    partnerLogo.style.opacity = "1";
  }, [logoHandoff, partnerLogoSrc, showLogo]);

  const className = `relative block w-[335px] overflow-hidden border-[0.75px] border-ink max-[599px]:w-full ${
    opaque || showLogo ? "bg-cream" : "bg-transparent"
  }`;
  const style = {
    height: STAMP_BOX_H,
    aspectRatio: STAMP_BOX_ASPECT_RATIO,
  };

  const body = (
    <>
      <div
        ref={logoFrameRef}
        className="pointer-events-none absolute inset-4 mix-blend-multiply"
      >
        <div
          ref={logoRef}
          className="absolute"
          style={{ opacity: 0 }}
        >
          <Image
            ref={logoImageRef}
            src={brandStampLogo}
            alt="The Stables"
            fill
            className="object-contain"
            sizes="285px"
            priority
          />
        </div>
      </div>
      {displayedLogo ? (
        <div
          ref={partnerLogoRef}
          className="pointer-events-none absolute inset-0"
          aria-hidden={logo ? undefined : true}
          style={{
            opacity: 0,
          }}
        >
          <StampBox
            src={displayedLogo.src}
            alt={displayedLogo.alt}
            placement={
              logoHandoff?.placement ?? CENTERED_CARD_LOGO_PLACEMENT
            }
            source={
              logoHandoff?.src === displayedLogo.src
                ? logoHandoff.source
                : null
            }
          />
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        style={style}
        onClick={(event) => {
          if (!onBack) return;
          if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
          ) {
            return;
          }
          event.preventDefault();
          onBack();
        }}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {body}
    </div>
  );
}
