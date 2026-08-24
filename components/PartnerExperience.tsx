"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CloseButton } from "@/components/CloseButton";
import { markAppBooted } from "@/lib/boot";
import type { Partner } from "@/lib/partners";

const CONTENT_STAGGER_MS = 40;
const MAX_REVEAL = 7;
/** The column arrives along Z, then the rows stagger in behind it. */
const ENTER_MS = 700;
const ENTER_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const STAGGER_DELAY_MS = 420;

type PartnerExperienceProps = {
  partner: Partner;
};

export function PartnerExperience({ partner }: PartnerExperienceProps) {
  const [infoOpen, setInfoOpen] = useState(true);
  const [inquireOpen, setInquireOpen] = useState(true);
  const [reveal, setReveal] = useState(0);
  const [entered, setEntered] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReveal(0);
    setEntered(false);
    markAppBooted();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setEntered(true);
      setReveal(MAX_REVEAL);
      return;
    }

    let step = 0;
    let timer = 0;
    const tick = () => {
      step += 1;
      setReveal(step);
      if (step >= MAX_REVEAL) return;
      timer = window.setTimeout(tick, CONTENT_STAGGER_MS);
    };
    const frame = requestAnimationFrame(() => setEntered(true));
    timer = window.setTimeout(tick, STAGGER_DELAY_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [partner.slug]);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    // The zoom hands off to the first frame, so ignore any restored offset.
    gallery.scrollLeft = 0;

    const onScroll = () => {
      const atStart = gallery.scrollLeft <= 8;
      setInfoOpen(atStart);
      setInquireOpen(atStart);
    };

    // Vertical wheel and trackpad gestures drive the sideways gallery.
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      gallery.scrollLeft += event.deltaY;
    };

    gallery.addEventListener("scroll", onScroll, { passive: true });
    gallery.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      gallery.removeEventListener("scroll", onScroll);
      gallery.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div className="relative h-[100svh] overflow-hidden bg-cream">
      {/* Full-bleed gallery, scrolling sideways */}
      <div
        ref={galleryRef}
        className="scroll-hidden absolute inset-0 z-0 flex overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        {partner.images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="relative h-full w-screen shrink-0"
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

      {/* Independently-scrolling left column, arriving along Z */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{ perspective: "1100px" }}
      >
        <aside
          className="pointer-events-none absolute top-0 left-0 flex h-full max-h-full w-full max-w-[375px] flex-col px-5 py-5"
          style={{
            transform: entered
              ? "translate3d(0px, 0px, 0px)"
              : "translate3d(0px, 8px, -520px)",
            opacity: entered ? 1 : 0,
            transition: `transform ${ENTER_MS}ms ${ENTER_EASE}, opacity ${Math.round(
              ENTER_MS * 0.6,
            )}ms ease-out`,
            willChange: "transform",
          }}
        >
          <div className="pointer-events-auto flex max-h-full flex-col gap-5 overflow-y-auto overscroll-none">
            <div className="relative h-[138px] w-[335px] shrink-0 border-[0.75px] border-ink bg-cream">
              <CloseButton className="absolute top-[-0.5px] right-[-0.5px] md:fixed md:top-5 md:right-5" />
              <div
                className={`absolute left-1/2 top-1/2 h-[88px] w-[215px] -translate-x-1/2 -translate-y-1/2 mix-blend-multiply ${
                  reveal >= 1 ? "opacity-100" : "opacity-0"
                }`}
              >
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
              className={`relative flex w-[335px] shrink-0 flex-col overflow-hidden border-[0.75px] border-ink bg-cream ${
                infoOpen ? "h-[138px]" : "h-10"
              }`}
            >
              <button
                type="button"
                onClick={() => setInfoOpen((open) => !open)}
                className="flex h-10 w-full shrink-0 cursor-pointer items-center justify-center border-b-[0.75px] border-ink bg-cream text-[12px] uppercase tracking-[0.02em]"
                style={{ cursor: "pointer" }}
              >
                <span className={reveal >= 2 ? "opacity-100" : "opacity-0"}>
                  Information
                </span>
              </button>
              <p
                className={`px-4 py-3 text-[12px] leading-normal ${
                  reveal >= 3 ? "opacity-100" : "opacity-0"
                }`}
              >
                {partner.description}
              </p>
            </div>

            <div
              className={`flex w-[335px] shrink-0 flex-col overflow-hidden bg-cream ${
                inquireOpen ? "h-[157px]" : "h-10"
              }`}
            >
              <button
                type="button"
                onClick={() => setInquireOpen((open) => !open)}
                className="relative -mb-px flex h-10 w-full shrink-0 cursor-pointer items-center justify-center border-[0.75px] border-ink bg-cream text-[12px] uppercase tracking-[0.02em]"
                style={{ cursor: "pointer" }}
              >
                <span className={reveal >= 4 ? "opacity-100" : "opacity-0"}>
                  Inquire
                </span>
              </button>
              <Link
                href={partner.links.wholesale}
                className={`relative -mb-px flex h-10 items-center border-[0.75px] border-ink bg-cream px-4 text-[12px] uppercase tracking-[0.02em] ${
                  reveal >= 5 ? "" : "pointer-events-none"
                }`}
              >
                <span className={reveal >= 5 ? "opacity-100" : "opacity-0"}>
                  Wholesale
                </span>
              </Link>
              <a
                href={partner.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative -mb-px flex h-10 items-center border-[0.75px] border-ink bg-cream px-4 text-[12px] uppercase tracking-[0.02em] ${
                  reveal >= 6 ? "" : "pointer-events-none"
                }`}
              >
                <span className={reveal >= 6 ? "opacity-100" : "opacity-0"}>
                  Instagram
                </span>
              </a>
              <a
                href={partner.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative flex h-10 items-center border-[0.75px] border-ink bg-cream px-4 text-[12px] uppercase tracking-[0.02em] ${
                  reveal >= 7 ? "" : "pointer-events-none"
                }`}
              >
                <span className={reveal >= 7 ? "opacity-100" : "opacity-0"}>
                  Website
                </span>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
