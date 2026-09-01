"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AddressBox } from "@/components/AddressBox";
import { ContactLinks, partnerContactRows } from "@/components/ContactLinks";
import { InfoBox } from "@/components/InfoBox";
import { PartnersList } from "@/components/PartnersList";
import { markAppBooted } from "@/lib/boot";
import {
  HEADER_OFF_MS,
  ITEM_STAGGER_MS,
  MORPH_MS,
} from "@/lib/morph";
import { partners as allPartners, type Partner } from "@/lib/partners";
import {
  disposeSilkscreenPrinter,
  getSilkscreenPrinter,
} from "@/lib/silkscreen-gl";
import { site } from "@/lib/site";

/** How long each frame holds before the next cut. */
const SLIDE_MS = 4200;

type PartnerExperienceProps = {
  partner: Partner;
};

export function PartnerExperience({ partner }: PartnerExperienceProps) {
  const router = useRouter();
  const images = partner.images;
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [listVisible, setListVisible] = useState(0);
  const [headerLabel, setHeaderLabel] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [detailOpen, setDetailOpen] = useState(true);
  const leavingRef = useRef(false);
  const morphTimersRef = useRef<number[]>([]);

  useEffect(() => {
    markAppBooted();
    router.prefetch("/");
  }, [router]);

  useEffect(() => {
    const printer = getSilkscreenPrinter();
    void printer?.preload(partner.stampLogo);
    for (const other of allPartners) {
      if (other.slug === partner.slug) continue;
      router.prefetch(`/partners/${other.slug}`);
      void printer?.preload(other.stampLogo);
    }
  }, [partner, router]);

  useEffect(() => {
    setIndex(0);
  }, [partner]);

  useEffect(() => {
    if (leaving || images.length < 2) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % images.length);
    }, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, leaving, images.length, partner.slug]);

  const handleBack = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      router.push("/");
      return;
    }

    setShowLogo(false);
    setHeaderLabel(true);
    setCollapsed(false);

    const after = (ms: number, run: () => void) => {
      morphTimersRef.current.push(window.setTimeout(run, ms));
    };

    const total = allPartners.length;
    for (let i = 0; i < total; i += 1) {
      after(ITEM_STAGGER_MS * (i + 1), () => setListVisible(i + 1));
    }

    const doneAt = Math.max(ITEM_STAGGER_MS * total + HEADER_OFF_MS, MORPH_MS);
    after(doneAt, () => {
      if (leavingRef.current) router.push("/");
    });
  };

  useEffect(
    () => () => {
      morphTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      if (!leavingRef.current) disposeSilkscreenPrinter();
    },
    [],
  );

  const homeContent = leaving;

  return (
    <div className="relative h-[100svh] overflow-hidden bg-cream">
      <button
        type="button"
        aria-label="Next image"
        onClick={() => {
          if (leaving) return;
          setDetailOpen(false);
          if (images.length < 2) return;
          setIndex((current) => (current + 1) % images.length);
        }}
        className="absolute inset-0 z-0 block cursor-pointer bg-cream"
      >
        <span className="sr-only">Next image</span>
        <span className="pointer-events-none absolute inset-0" aria-hidden>
          {images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              sizes="100vw"
              priority
              fetchPriority={i === 0 ? "high" : "low"}
              className={`object-cover ${
                leaving || i !== index ? "invisible" : "visible"
              }`}
            />
          ))}
        </span>
      </button>

      <div className="pointer-events-none absolute inset-0 z-20">
        <aside className="pointer-events-none absolute inset-x-0 top-0 mx-auto flex h-full max-h-full w-full max-w-[375px] flex-col justify-center px-5 py-5 max-[599px]:max-w-none">
          <div className="pointer-events-auto flex min-h-0 w-full max-h-full flex-col overflow-y-auto overscroll-none">
            <div className="order-1 shrink-0">
              <AddressBox
                collapsed={collapsed}
                href="/"
                onBack={handleBack}
              />
            </div>

            <div
              className={`relative z-[1] shrink-0 -mt-px ${
                homeContent ? "order-2" : "order-3"
              }`}
            >
              <InfoBox
                body={
                  homeContent ? site.informationBox : partner.description
                }
                moreHref={homeContent ? "/about" : undefined}
                fit={homeContent}
                open={detailOpen}
                onOpenChange={setDetailOpen}
              />
            </div>

            <div
              className={`relative z-[1] shrink-0 -mt-px ${
                homeContent ? "order-3" : "order-2"
              }`}
            >
              <PartnersList
                partners={allPartners}
                collapsed={collapsed}
                visibleCount={listVisible}
                showHeaderLabel={headerLabel}
                locked
                logo={
                  showLogo
                    ? { src: partner.stampLogo, alt: partner.name }
                    : null
                }
                onLogoClick={
                  showLogo && !leaving
                    ? () => setDetailOpen(true)
                    : undefined
                }
              />
            </div>

            <div className="relative z-[1] order-4 shrink-0 -mt-px">
              <ContactLinks
                title={homeContent ? "CONTACT" : "INQUIRE"}
                rows={
                  homeContent
                    ? undefined
                    : partnerContactRows(partner.links)
                }
                open={detailOpen}
                onOpenChange={setDetailOpen}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
