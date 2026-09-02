"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { StampBox } from "@/components/StampBox";
import { STAMP_BOX_ASPECT_RATIO, STAMP_BOX_H } from "@/lib/morph";
import type { PartnerLogoHandoff } from "@/lib/partner-transition";
import { brandStampLogo } from "@/lib/partners";

const HOME_LOGO_POSITION_KEY = "the-stables:home-logo-position:business-card";

type LogoPosition = {
  left: number;
  top: number;
  scale?: number;
};

function readPosition(key: string) {
  const saved = window.sessionStorage.getItem(key);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as LogoPosition;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

type AddressBoxProps = {
  showLogo?: boolean;
  /** Replaces The Stables artwork without replacing or moving this module. */
  logo?: { src: string; alt: string };
  opaque?: boolean;
  href?: string;
  onBack?: () => void;
  logoHandoff?: PartnerLogoHandoff | null;
};

export function AddressBox({
  showLogo = true,
  logo,
  opaque = false,
  href,
  onBack,
  logoHandoff = null,
}: AddressBoxProps) {
  const logoRef = useRef<HTMLDivElement>(null);
  const partnerLogoRef = useRef<HTMLDivElement>(null);
  const lastLogoRef = useRef(logo);
  if (logo) lastLogoRef.current = logo;

  const displayedLogo = lastLogoRef.current;
  const partnerLogoSrc = logo?.src;

  useLayoutEffect(() => {
    const stablesLogo = logoRef.current;
    if (!stablesLogo) return;
    stablesLogo.style.opacity = "0";
    if (!showLogo || partnerLogoSrc) return;

    let position = readPosition(HOME_LOGO_POSITION_KEY);
    position ??= {
      left: Math.round(Math.random() * 50),
      top: Math.round(-24 + Math.random() * 18),
    };

    stablesLogo.style.left = `${position.left}px`;
    stablesLogo.style.top = `${position.top}px`;
    window.sessionStorage.setItem(
      HOME_LOGO_POSITION_KEY,
      JSON.stringify(position),
    );
    stablesLogo.style.opacity = "1";
  }, [partnerLogoSrc, showLogo]);

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

    partnerLogo.style.transform = logoHandoff.transform;
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
        ref={logoRef}
        className="pointer-events-none absolute top-[-18px] left-[15px] h-[218px] w-[285px] mix-blend-multiply"
        style={{
          opacity: 0,
        }}
      >
        <div className="relative h-full w-full -rotate-[1.6deg]">
          <Image
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
            transformOrigin: "center",
          }}
        >
          <StampBox
            src={displayedLogo.src}
            alt={displayedLogo.alt}
            seed={displayedLogo.alt}
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
