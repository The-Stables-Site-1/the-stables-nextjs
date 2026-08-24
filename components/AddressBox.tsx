"use client";

import Image from "next/image";
import Link from "next/link";
import { MORPH_EASE, MORPH_MS, ROW_H, STAMP_BOX_H } from "@/lib/morph";
import { brandStampLogo } from "@/lib/partners";

type AddressBoxProps = {
  showLogo?: boolean;
  opaque?: boolean;
  /** Slides down to a single row and reads BACK. */
  collapsed?: boolean;
  href?: string;
  onBack?: () => void;
};

export function AddressBox({
  showLogo = true,
  opaque = false,
  collapsed = false,
  href,
  onBack,
}: AddressBoxProps) {
  const className = `relative block w-[335px] overflow-hidden border-[0.75px] border-ink max-[599px]:w-full ${
    opaque || showLogo || collapsed ? "bg-cream" : "bg-transparent"
  }`;
  const style = {
    height: collapsed ? ROW_H : STAMP_BOX_H,
    transition: `height ${MORPH_MS}ms ${MORPH_EASE}`,
  };

  const body = (
    <>
      <div
        className={`pointer-events-none absolute top-[-18px] left-[15px] h-[173px] w-[227px] mix-blend-multiply ${
          showLogo && !collapsed ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="relative h-full w-full -rotate-[1.6deg]">
          <Image
            src={brandStampLogo}
            alt="The Stables"
            fill
            className="object-contain"
            sizes="227px"
            priority
          />
        </div>
      </div>
      {collapsed ? (
        <span className="absolute inset-0 flex items-center justify-center text-[12px] uppercase tracking-[0.02em]">
          Back
        </span>
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
