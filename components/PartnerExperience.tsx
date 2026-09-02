"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AddressBox } from "@/components/AddressBox";
import { ContactLinks, partnerContactRows } from "@/components/ContactLinks";
import { InfoBox } from "@/components/InfoBox";
import { PartnersList } from "@/components/PartnersList";
import { markAppBooted } from "@/lib/boot";
import {
  LOGO_HOLD_MS,
  partnersOpenHeight,
  ROUTE_MORPH_EASE,
  ROUTE_MORPH_MS,
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
  const [showPartnerLogo, setShowPartnerLogo] = useState(true);
  const [detailOpen, setDetailOpen] = useState(true);
  const leavingRef = useRef(false);
  const panelHoveredRef = useRef(false);
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

  const setPanelOpen = useCallback((next: boolean) => {
    if (
      !next &&
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }
    setDetailOpen(next);
  }, []);

  useEffect(() => {
    if (leaving || images.length < 2) return;
    const timer = window.setTimeout(() => {
      if (
        window.matchMedia("(hover: hover)").matches &&
        !panelHoveredRef.current
      ) {
        setPanelOpen(false);
      }
      setIndex((current) => (current + 1) % images.length);
    }, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, leaving, images.length, partner.slug, setPanelOpen]);

  const handleReturnHome = () => {
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

    setShowPartnerLogo(false);
    setDetailOpen(true);

    morphTimersRef.current.push(
      window.setTimeout(() => {
        if (leavingRef.current) router.push("/");
      }, ROUTE_MORPH_MS + LOGO_HOLD_MS),
    );
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
          if (
            window.matchMedia("(hover: hover) and (pointer: fine)").matches
          ) {
            setPanelOpen(false);
          }
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
              alt={`${partner.name} brand image ${i + 1}`}
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
          <div
            className="pointer-events-auto flex min-h-0 w-full max-h-full flex-col overflow-y-auto overscroll-none"
            onPointerEnter={() => {
              panelHoveredRef.current = true;
              setPanelOpen(true);
            }}
            onPointerLeave={() => {
              panelHoveredRef.current = false;
            }}
          >
            <div className="order-1 shrink-0">
              <AddressBox
                logo={
                  showPartnerLogo
                    ? { src: partner.stampLogo, alt: partner.name }
                    : undefined
                }
                href="/"
                onBack={handleReturnHome}
              />
            </div>

            <div
              className={`relative z-[1] order-2 shrink-0 ${
                detailOpen ? "-mt-px" : ""
              }`}
            >
              <InfoBox
                body={
                  homeContent ? site.informationBox : (partner.descriptionBlocks ?? partner.description)
                }
                moreHref={homeContent ? "/about" : undefined}
                fit
                open={detailOpen}
                onOpenChange={setPanelOpen}
                collapsedHeight={0}
                transitionMs={ROUTE_MORPH_MS}
                transitionEase={ROUTE_MORPH_EASE}
              />
            </div>

            {leaving ? (
              <div
                className="relative z-[1] order-3 shrink-0 -mt-px overflow-hidden"
                style={{
                  height: partnersOpenHeight(allPartners.length),
                  animation: `partners-expand ${ROUTE_MORPH_MS}ms ${ROUTE_MORPH_EASE} both`,
                }}
              >
                <PartnersList partners={allPartners} locked />
              </div>
            ) : null}

            <div
              className={`relative z-[1] shrink-0 ${
                leaving ? "order-4" : "order-3"
              } ${detailOpen ? "-mt-px" : ""}`}
            >
              <ContactLinks
                title="CONTACT"
                rows={
                  homeContent
                    ? undefined
                    : partnerContactRows(partner.links)
                }
                open={detailOpen}
                onOpenChange={setPanelOpen}
                collapsedHeight={0}
                transitionMs={ROUTE_MORPH_MS}
                transitionEase={ROUTE_MORPH_EASE}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
