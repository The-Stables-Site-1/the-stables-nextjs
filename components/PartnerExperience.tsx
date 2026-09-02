"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AddressBox } from "@/components/AddressBox";
import { ContactLinks, partnerContactRows } from "@/components/ContactLinks";
import { InfoBox } from "@/components/InfoBox";
import { PartnersList } from "@/components/PartnersList";
import { markAppBooted } from "@/lib/boot";
import {
  beginHomeLogoHandoff,
  type CardLogoPlacement,
} from "@/lib/card-logo-placement";
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
import {
  ensurePartnerLogoHandoff,
  getPartnerLogoHandoff,
  type PartnerLogoHandoff,
} from "@/lib/partner-transition";
import { site } from "@/lib/site";

/** How long each frame holds before the next cut. */
const SLIDE_MS = 4200;
/** Center while it fits, then pin the growing reverse stack 20px from the visual top. */
const CLAMPED_STACK_SHIFT =
  "calc(var(--partner-visual-top, 0px) + max(0px, calc(50% + 20px - var(--partner-visual-half-height, 50vh))))";
const CLAMPED_STACK_TRANSFORM = `translateY(${CLAMPED_STACK_SHIFT})`;
const HOME_STACK_TRANSFORM =
  `translateY(var(--partner-home-shift, ${CLAMPED_STACK_SHIFT}))`;

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
  const [settlingHome, setSettlingHome] = useState(false);
  const [homeLogoPlacement, setHomeLogoPlacement] =
    useState<CardLogoPlacement | null>(null);
  const [logoHandoff, setLogoHandoff] =
    useState<PartnerLogoHandoff | null>(() =>
      typeof window === "undefined"
        ? null
        : getPartnerLogoHandoff(partner.stampLogo),
    );
  const leavingRef = useRef(false);
  const panelHoveredRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const partnersTransitionRef = useRef<HTMLDivElement>(null);
  const morphTimersRef = useRef<number[]>([]);
  const routeQueuedRef = useRef(false);

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

  const finishReturnHome = useCallback(() => {
    if (routeQueuedRef.current) return;
    routeQueuedRef.current = true;
    morphTimersRef.current.push(
      window.setTimeout(() => {
        if (leavingRef.current) router.push("/");
      }, LOGO_HOLD_MS),
    );
  }, [router]);

  useLayoutEffect(() => {
    let cancelled = false;
    void ensurePartnerLogoHandoff(
      partner.stampLogo,
      partner.name,
    ).then((handoff) => {
      if (!cancelled) setLogoHandoff(handoff);
    });
    return () => {
      cancelled = true;
    };
  }, [partner.name, partner.stampLogo]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const updateVisualViewport = () => {
      const viewport = window.visualViewport;
      panel.style.setProperty(
        "--partner-visual-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
      panel.style.setProperty(
        "--partner-visual-half-height",
        `${(viewport?.height ?? window.innerHeight) / 2}px`,
      );
    };
    updateVisualViewport();
    window.visualViewport?.addEventListener("resize", updateVisualViewport);
    window.visualViewport?.addEventListener("scroll", updateVisualViewport);
    return () => {
      window.visualViewport?.removeEventListener(
        "resize",
        updateVisualViewport,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        updateVisualViewport,
      );
    };
  }, []);

  useLayoutEffect(() => {
    if (!settlingHome) return;
    const panel = panelRef.current;
    if (!panel) return;

    const alignToHome = () => {
      const desiredTop = (window.visualViewport?.offsetTop ?? 0) + 20;
      const rect = panel.getBoundingClientRect();
      const currentTransform = new DOMMatrix(
        window.getComputedStyle(panel).transform,
      ).m42;
      const targetTransform = currentTransform + desiredTop - rect.top;
      panel.style.setProperty(
        "--partner-home-shift",
        `${targetTransform}px`,
      );
      if (Math.abs(rect.top - desiredTop) < 0.1) {
        queueMicrotask(finishReturnHome);
      }
    };
    alignToHome();
    window.visualViewport?.addEventListener("resize", alignToHome);
    return () =>
      window.visualViewport?.removeEventListener("resize", alignToHome);
  }, [finishReturnHome, settlingHome]);

  const setPanelOpen = useCallback((next: boolean) => {
    if (!next && panelHoveredRef.current) return;
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
    setHomeLogoPlacement(beginHomeLogoHandoff());
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
    <div className="visual-viewport-height relative overflow-hidden bg-cream">
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
        className="visual-viewport-fixed z-0 block cursor-pointer bg-cream"
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
                i !== index ? "invisible" : "visible"
              }`}
            />
          ))}
        </span>
      </button>

      <div className="pointer-events-none absolute inset-0 z-20">
        <aside className="pointer-events-none absolute inset-x-0 top-0 mx-auto flex h-full max-h-full w-full max-w-[375px] flex-col justify-center px-5 py-5 max-[599px]:max-w-none">
          <div
            ref={panelRef}
            className={`pointer-events-auto flex min-h-0 w-full flex-col overscroll-none ${
              leaving
                ? "max-h-none shrink-0 overflow-visible"
                : "max-h-full overflow-y-auto"
            }`}
            style={{
              transform: settlingHome
                ? HOME_STACK_TRANSFORM
                : CLAMPED_STACK_TRANSFORM,
              transition: settlingHome
                ? `transform ${ROUTE_MORPH_MS}ms ${ROUTE_MORPH_EASE}`
                : undefined,
            }}
            onPointerEnter={() => {
              panelHoveredRef.current = true;
              setPanelOpen(true);
            }}
            onPointerLeave={() => {
              panelHoveredRef.current = false;
            }}
            onTransitionEnd={(event) => {
              if (
                settlingHome &&
                event.propertyName === "transform" &&
                event.target === event.currentTarget
              ) {
                finishReturnHome();
              }
            }}
          >
            <div className="order-1 shrink-0">
              <AddressBox
                logo={
                  showPartnerLogo
                    ? { src: partner.stampLogo, alt: partner.name }
                    : undefined
                }
                logoHandoff={logoHandoff}
                homeLogoPlacement={homeLogoPlacement}
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
                ref={partnersTransitionRef}
                className="relative z-[1] order-3 shrink-0 -mt-px overflow-hidden"
                style={{
                  height: partnersOpenHeight(allPartners.length),
                  animation: `partners-expand ${ROUTE_MORPH_MS}ms ${ROUTE_MORPH_EASE} both`,
                }}
                onAnimationEnd={(event) => {
                  if (
                    event.animationName === "partners-expand" &&
                    leavingRef.current
                  ) {
                    setSettlingHome(true);
                  }
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
