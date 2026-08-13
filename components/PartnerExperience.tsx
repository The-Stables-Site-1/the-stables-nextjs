"use client";

import Image from "next/image";
import Link from "next/link";
import { CloseButton } from "@/components/CloseButton";
import type { Partner } from "@/lib/partners";

type PartnerExperienceProps = {
  partner: Partner;
};

export function PartnerExperience({ partner }: PartnerExperienceProps) {
  return (
    <div className="relative bg-cream">
      <CloseButton />

      {/* Full-bleed scrolling gallery */}
      <div className="relative z-0">
        {partner.images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="relative h-screen w-full min-h-[100svh]"
          >
            <Image
              src={src}
              alt={`${partner.name} ${index + 1}`}
              fill
              className="object-cover"
              sizes="100vw"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Sticky independently-scrolling left column */}
      <aside className="pointer-events-none fixed top-0 left-0 z-20 flex h-screen max-h-screen w-full max-w-[375px] flex-col px-5 py-5">
        <div className="pointer-events-auto flex max-h-full flex-col gap-5 overflow-y-auto">
          <div className="relative h-[138px] w-[335px] shrink-0 border-[0.75px] border-ink bg-cream">
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

          <div className="relative flex h-[138px] w-[335px] shrink-0 flex-col border-[0.75px] border-ink bg-cream">
            <div className="flex h-10 shrink-0 items-center justify-center border-b-[0.75px] border-ink">
              <p className="text-[12px] uppercase tracking-[0.02em]">
                Information
              </p>
            </div>
            <p className="px-4 py-3 text-[12px] leading-normal">
              {partner.description}
            </p>
          </div>

          <div className="flex w-[335px] shrink-0 flex-col bg-cream">
            <div className="relative -mb-px flex h-10 items-center justify-center border-[0.75px] border-ink bg-cream text-[12px] uppercase tracking-[0.02em]">
              Inquire
            </div>
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
