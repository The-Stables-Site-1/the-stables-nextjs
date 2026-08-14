"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CloseButton } from "@/components/CloseButton";
import { markAppBooted } from "@/lib/boot";
import type { Partner } from "@/lib/partners";

type PartnerExperienceProps = {
  partner: Partner;
};

export function PartnerExperience({ partner }: PartnerExperienceProps) {
  const [infoOpen, setInfoOpen] = useState(true);
  const [inquireOpen, setInquireOpen] = useState(true);

  useEffect(() => {
    markAppBooted();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const atTop = window.scrollY <= 8;
      setInfoOpen(atTop);
      setInquireOpen(atTop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative bg-cream">
      {/* Full-bleed scrolling gallery */}
      <div className="relative z-0">
        {partner.images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="relative h-screen w-full min-h-[100svh]"
          >
            {index === 0 ? (
              // eslint-disable-next-line @next/next/no-img-element -- snap on after WebGL, no fade-in
              <img
                src={src}
                alt={`${partner.name} 1`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image
                src={src}
                alt={`${partner.name} ${index + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
              />
            )}
          </div>
        ))}
      </div>

      {/* Sticky independently-scrolling left column */}
      <aside className="pointer-events-none fixed top-0 left-0 z-20 flex h-screen max-h-screen w-full max-w-[375px] flex-col px-5 py-5">
        <div className="pointer-events-auto flex max-h-full flex-col gap-5 overflow-y-auto overscroll-none">
          <div className="relative h-[138px] w-[335px] shrink-0 border-[0.75px] border-ink bg-cream">
            <CloseButton className="absolute top-[-0.5px] right-[-0.5px] md:fixed md:top-5 md:right-5" />
            <div className="absolute left-1/2 top-1/2 h-[88px] w-[215px] -translate-x-1/2 -translate-y-1/2 mix-blend-multiply">
              <div className="relative h-full w-full rotate-[4.87deg]">
                <Image
                  src={partner.stampLogo}
                  alt={partner.name}
                  fill
                  className="object-contain"
                  sizes="215px"
                  priority
                />
              </div>
            </div>
          </div>

          <div
            className={`relative flex w-[335px] shrink-0 flex-col overflow-hidden border-[0.75px] border-ink bg-cream transition-[height] duration-300 ease-out ${
              infoOpen ? "h-[138px]" : "h-10"
            }`}
          >
            <button
              type="button"
              onClick={() => setInfoOpen((open) => !open)}
              className="flex h-10 w-full shrink-0 items-center justify-center border-b-[0.75px] border-ink bg-cream text-[12px] uppercase tracking-[0.02em]"
            >
              Information
            </button>
            <p className="px-4 py-3 text-[12px] leading-normal">
              {partner.description}
            </p>
          </div>

          <div
            className={`flex w-[335px] shrink-0 flex-col overflow-hidden bg-cream transition-[height] duration-300 ease-out ${
              inquireOpen ? "h-[157px]" : "h-10"
            }`}
          >
            <button
              type="button"
              onClick={() => setInquireOpen((open) => !open)}
              className="relative -mb-px flex h-10 w-full shrink-0 items-center justify-center border-[0.75px] border-ink bg-cream text-[12px] uppercase tracking-[0.02em]"
            >
              Inquire
            </button>
            <Link
              href={partner.links.wholesale}
              className="relative -mb-px flex h-10 items-center border-[0.75px] border-ink bg-cream px-4 text-[12px] uppercase tracking-[0.02em]"
            >
              Wholesale
            </Link>
            <a
              href={partner.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="relative -mb-px flex h-10 items-center border-[0.75px] border-ink bg-cream px-4 text-[12px] uppercase tracking-[0.02em]"
            >
              Instagram
            </a>
            <a
              href={partner.links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex h-10 items-center border-[0.75px] border-ink bg-cream px-4 text-[12px] uppercase tracking-[0.02em]"
            >
              Website
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
