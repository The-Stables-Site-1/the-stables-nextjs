"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import { useRouter } from "next/navigation";
import { AddressBox } from "@/components/AddressBox";
import { ContactLinks, partnerContactRows } from "@/components/ContactLinks";
import { InfoBox } from "@/components/InfoBox";
import { BEAT_MS, IntroSequence, type IntroRect } from "@/components/IntroSequence";
import { Loader } from "@/components/Loader";
import { LogoStamp } from "@/components/LogoStamp";
import { PartnersList } from "@/components/PartnersList";
import { hasAppBooted, markAppBooted } from "@/lib/boot";
import {
  LOGO_HOLD_MS,
  ROUTE_MORPH_EASE,
  ROUTE_MORPH_MS,
  STAMP_ART_H,
  STAMP_ART_W,
} from "@/lib/morph";
import type { Partner } from "@/lib/partners";
import {
  beginPartnerLogoHandoff,
  type PartnerLogoHandoff,
} from "@/lib/partner-transition";
import {
  disposeSilkscreenPrinter,
  getSilkscreenPrinter,
} from "@/lib/silkscreen-gl";
import { site } from "@/lib/site";
import {
  planStampField,
  type StampLogo,
  type StampPlacement,
} from "@/lib/stamp-field";

type Phase = "loader" | "hero" | "intro" | "ready";

const LOADER_MS = 900;
const CONTENT_PAUSE_MS = 80;
const CONTENT_STAGGER_MS = 40;
const BOX_REVEAL = 4;
/** Reveal step at which the address module carries its stamp. */
const ADDRESS_REVEAL = BOX_REVEAL + 1;
/** Information, partners, contact: the three modules under the address box. */
const MODULE_COUNT = 3;
/** Header plus three rows in the home Contact module. */
const CONTACT_REVEAL_STEPS = 4;
/** Set to true to restore the horse intro loader. */
const SHOW_HORSE_LOADER = false;

const IDLE_MS = 500;

/** Idle stamping cadence: one impression at a time, never lifted. */
const STAMP_GAP_MS = 600;
/** Ceiling on accumulated impressions, so the page cannot grow forever. */
const MAX_STAMPS = 16;

const randomSeed = () => (Math.random() * 0xffffffff) >>> 0;

type StampInstance = {
  id: number;
  placement: StampPlacement;
};

type HomeExperienceProps = {
  partners: Partner[];
};

export function HomeExperience({ partners }: HomeExperienceProps) {
  const infoTitleAt = ADDRESS_REVEAL + 1;
  const infoBodyAt = infoTitleAt + 1;
  const partnerTitleAt = infoBodyAt + 1;
  const partnerStart = partnerTitleAt + 1;
  const contactStart = partnerStart + partners.length;
  const maxReveal = contactStart + CONTACT_REVEAL_STEPS - 1;

  const [phase, setPhase] = useState<Phase>(() =>
    hasAppBooted() ? "ready" : SHOW_HORSE_LOADER ? "loader" : "hero",
  );
  const [reveal, setReveal] = useState(() =>
    hasAppBooted() ? maxReveal : BOX_REVEAL,
  );
  const [introRect, setIntroRect] = useState<IntroRect | null>(null);
  const [addressIn, setAddressIn] = useState(() => hasAppBooted());
  const [modulesIn, setModulesIn] = useState(() =>
    hasAppBooted() ? MODULE_COUNT : 0,
  );
  const pageRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const introTimersRef = useRef<number[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [logosReady, setLogosReady] = useState(false);
  const [morphPartner, setMorphPartner] = useState<Partner | null>(null);
  const [logoHandoff, setLogoHandoff] =
    useState<PartnerLogoHandoff | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [stamps, setStamps] = useState<StampInstance[]>([]);
  const morphTimersRef = useRef<number[]>([]);
  const lockedRef = useRef(false);
  const idleTimerRef = useRef(0);
  const stampTimerRef = useRef(0);
  const stampRunRef = useRef(0);
  const stampCountRef = useRef(0);
  const nextStampIdRef = useRef(1);
  const logosRef = useRef<StampLogo[]>([]);
  const heroPromisesRef = useRef(new Map<string, Promise<void>>());
  const requestedPreviewRef = useRef<string | null>(null);
  const activeSlugRef = useRef<string | null>(null);
  const stopIdleRef = useRef(() => {});
  const armIdleRef = useRef(() => {});
  const router = useRouter();

  useEffect(() => {
    const printer = getSilkscreenPrinter();
    if (!printer) {
      const fallbackReady = window.setTimeout(() => setLogosReady(true), 0);
      return () => window.clearTimeout(fallbackReady);
    }

    let alive = true;
    void (async () => {
      const sizeBySrc = new Map<string, { w: number; h: number }>();
      for (const partner of partners) {
        if (!partner.stampLogo) continue;
        let size = sizeBySrc.get(partner.stampLogo);
        if (!size) {
          const loaded = await printer.preload(partner.stampLogo);
          if (!alive) return;
          if (!loaded) continue;
          size = loaded;
          sizeBySrc.set(partner.stampLogo, size);
        }
        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        await printer.printStamp(
          partner.stampLogo,
          Math.max(1, Math.round(STAMP_ART_W * dpr)),
          Math.max(1, Math.round(STAMP_ART_H * dpr)),
          1,
          true,
        );
        logosRef.current = [
          ...logosRef.current,
          {
            slug: partner.slug,
            name: partner.name,
            src: partner.stampLogo,
            aspect: size.w / Math.max(size.h, 1),
          },
        ];
      }
      if (alive) setLogosReady(true);
    })();

    return () => {
      alive = false;
    };
  }, [partners]);

  useEffect(() => {
    const pending = new Map<string, Promise<void>>();
    for (const partner of partners) {
      const src = partner.images[0];
      if (!src) continue;

      const image = new window.Image();
      image.decoding = "async";
      const { props } = getImageProps({
        src,
        alt: "",
        fill: true,
        sizes: "100vw",
      });
      image.srcset = props.srcSet ?? "";
      image.sizes = props.sizes ?? "100vw";
      image.src = props.src;
      const ready = image.decode().catch(
        () =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
      );
      pending.set(partner.slug, ready);
    }
    heroPromisesRef.current = pending;
  }, [partners]);

  useEffect(
    () => () => {
      morphTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(idleTimerRef.current);
      window.clearTimeout(stampTimerRef.current);
      // Partner pages reuse the printer during their morph. All other routes
      // should release its full-screen bitmap cache and GPU context.
      if (!lockedRef.current) disposeSilkscreenPrinter();
    },
    [],
  );

  const afterIntro = (ms: number, run: () => void) => {
    introTimersRef.current.push(window.setTimeout(run, ms));
  };

  /** Walks the reveal counter up so each label lands one after the next. */
  const startContentStagger = useCallback(
    (from: number) => {
      let step = from;
      setReveal(step);
      setPhase("intro");
      const tick = () => {
        step += 1;
        setReveal(step);
        if (step >= maxReveal) {
          setPhase("ready");
          return;
        }
        const delay =
          step === infoBodyAt || step === contactStart - 1
            ? BEAT_MS
            : CONTENT_STAGGER_MS;
        introTimersRef.current.push(
          window.setTimeout(tick, delay),
        );
      };
      introTimersRef.current.push(window.setTimeout(tick, CONTENT_PAUSE_MS));
    },
    [contactStart, infoBodyAt, maxReveal],
  );

  useEffect(() => {
    const alreadyBooted = hasAppBooted();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (alreadyBooted) {
      markAppBooted();
      return;
    }

    if (reduceMotion) {
      markAppBooted();
      const revealAll = window.setTimeout(() => {
        setReveal(maxReveal);
        setAddressIn(true);
        setModulesIn(MODULE_COUNT);
        setPhase("ready");
      }, 0);
      return () => window.clearTimeout(revealAll);
    }

    if (!SHOW_HORSE_LOADER) {
      return;
    }

    const loader = window.setTimeout(() => setPhase("hero"), LOADER_MS);
    return () => window.clearTimeout(loader);
  }, [maxReveal]);

  useEffect(
    () => () => {
      introTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  // The intro card rises to wherever the address module actually sits, so the
  // hand-off is a swap rather than an approximation.
  useLayoutEffect(() => {
    if (phase !== "hero") return;
    const el = addressRef.current;
    if (!el) return;

    const measure = () => {
      const box = el.getBoundingClientRect();
      setIntroRect({
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [phase]);

  /** The card has flipped and is on its way up; drop the rest of the stack in. */
  const handleIntroTurn = () => {
    setReveal(ADDRESS_REVEAL);
    let shown = 0;
    const tick = () => {
      shown += 1;
      setModulesIn(shown);
      if (shown < MODULE_COUNT) afterIntro(BEAT_MS, tick);
    };
    afterIntro(BEAT_MS, tick);
  };

  /** The card is in the slot: hand the position back to the real module. */
  const handleIntroLand = () => {
    markAppBooted();
    setAddressIn(true);
    startContentStagger(ADDRESS_REVEAL);
  };

  const ready = phase === "ready";
  const stampSurface = () => {
    const page = pageRef.current;
    const column = asideRef.current;
    const pageBox = page?.getBoundingClientRect();
    const columnBox = column?.getBoundingClientRect();

    return {
      // client dimensions reflect the page's normal-flow content without
      // letting deliberately overhanging absolute stamps enlarge the next plan.
      width: page?.clientWidth ?? document.documentElement.clientWidth,
      height: page?.clientHeight ?? document.documentElement.clientHeight,
      seed: randomSeed(),
      avoid: pageBox && columnBox
        ? {
            x: columnBox.left - pageBox.left,
            y: columnBox.top - pageBox.top,
            w: columnBox.width,
            // Idle stamps live on the z-0 layer, behind the opaque z-10 content
            // column, so anything under the column is hidden anyway. The keep-out
            // rect only needs to cover roughly the collapsed column height; when
            // the fit INFORMATION box grows the column taller, clamping the
            // height stops that growth from shrinking (starving) the placeable
            // area. Any stamp behind the grown box stays hidden, so this cannot
            // print over the readable text. Cap ~= pre-fit column height
            // (address + info + partners + contact).
            h: Math.min(columnBox.height, 600),
          }
        : null,
    };
  };

  const handleHover = (slug: string) => {
    if (slug === activeSlugRef.current) return;
    stopIdle();
    requestedPreviewRef.current = slug;
    stampCountRef.current = 0;
    setStamps([]);
    setActiveSlug(slug);
    router.prefetch(`/partners/${slug}`);

    const ready = heroPromisesRef.current.get(slug) ?? Promise.resolve();
    void ready.then(() => {
      if (requestedPreviewRef.current === slug && !lockedRef.current) {
        setPreviewSlug(slug);
      }
    });
  };

  const stopIdle = () => {
    window.clearTimeout(idleTimerRef.current);
    window.clearTimeout(stampTimerRef.current);
    idleTimerRef.current = 0;
    stampTimerRef.current = 0;
    stampRunRef.current += 1;
  };

  /**
   * Presses one logo at a time and leaves every impression on the page. When a
   * layout runs out another is planned, so the sheet keeps filling up.
   */
  const runStampField = () => {
    const run = stampRunRef.current;

    let plan: StampPlacement[] = [];
    let index = 0;

    const pressNext = () => {
      if (stampRunRef.current !== run || lockedRef.current) return;
      if (document.hidden) return;
      if (stampCountRef.current >= MAX_STAMPS) return;

      if (!logosRef.current.length) {
        stampTimerRef.current = window.setTimeout(pressNext, 400);
        return;
      }

      if (index >= plan.length) {
        const surface = stampSurface();
        plan = planStampField({ logos: logosRef.current, ...surface });
        if (!plan.length) {
          plan = planStampField({
            logos: logosRef.current,
            ...surface,
            avoid: null,
          });
        }
        index = 0;
        // An empty plan (e.g. the layout momentarily starves placement) must not
        // kill the loop — retry later so the field keeps filling as things settle.
        if (!plan.length) {
          stampTimerRef.current = window.setTimeout(pressNext, STAMP_GAP_MS);
          return;
        }
      }

      const placement = plan[index];
      index += 1;
      const id = nextStampIdRef.current;
      nextStampIdRef.current += 1;
      stampCountRef.current += 1;
      setStamps((current) => [...current, { id, placement }]);
      stampTimerRef.current = window.setTimeout(pressNext, STAMP_GAP_MS);
    };

    pressNext();
  };

  const armIdle = () => {
    stopIdle();
    if (lockedRef.current || activeSlugRef.current || document.hidden) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const run = stampRunRef.current;
    idleTimerRef.current = window.setTimeout(() => {
      if (stampRunRef.current !== run || lockedRef.current) return;
      runStampField();
    }, IDLE_MS);
  };

  const onPartnerHover = (slug: string | null) => {
    if (slug) handleHover(slug);
  };

  const handleContainerLeave = () => {
    if (lockedRef.current) return;
    requestedPreviewRef.current = null;
    activeSlugRef.current = null;
    setActiveSlug(null);
    setPreviewSlug(null);
    armIdle();
  };

  const handleSelect = (slug: string) => {
    stopIdle();
    const partner = partners.find((item) => item.slug === slug);
    if (!partner) return;

    const href = `/partners/${slug}`;
    lockedRef.current = true;
    setLocked(true);
    setActiveSlug(slug);

    const url = partner.images[0] ?? null;
    const heroReady =
      heroPromisesRef.current.get(slug) ?? Promise.resolve();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!url) {
      router.push(href);
      return;
    }

    if (reduceMotion) {
      void Promise.all([
        heroReady,
        beginPartnerLogoHandoff(partner.stampLogo, partner.name),
      ]).then(([, handoff]) => {
        setLogoHandoff(handoff);
        router.push(href);
      });
      return;
    }

    void Promise.all([
      heroReady,
      beginPartnerLogoHandoff(partner.stampLogo, partner.name),
    ]).then(([, handoff]) => {
      if (!lockedRef.current) return;
      setPreviewSlug(slug);
      setLogoHandoff(handoff);
      setMorphPartner(partner);

      morphTimersRef.current.push(
        window.setTimeout(
          () => {
            if (lockedRef.current) router.push(href);
          },
          ROUTE_MORPH_MS + LOGO_HOLD_MS,
        ),
      );
    });
  };

  // Keep the idle loop pointed at the latest handlers without restarting it.
  useEffect(() => {
    activeSlugRef.current = activeSlug;
    stopIdleRef.current = stopIdle;
    armIdleRef.current = armIdle;
  });

  // A hero preview pauses idle work; leaving the whole content column clears
  // it and starts a fresh idle delay. Hidden tabs do not keep printing.
  useEffect(() => {
    if (phase !== "ready" || locked) return;
    const onVis = () => {
      if (document.hidden) stopIdleRef.current();
      else armIdleRef.current();
    };
    document.addEventListener("visibilitychange", onVis);
    if (!document.hidden) armIdleRef.current();
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stopIdleRef.current();
    };
  }, [phase, locked, activeSlug]);

  const interactive =
    logosReady && !locked && phase !== "loader" && phase !== "hero";
  const previewPartner = previewSlug
    ? partners.find((partner) => partner.slug === previewSlug)
    : null;
  const hasVisuals = previewPartner != null || stamps.length > 0;
  const morphing = morphPartner != null;

  const infoBox = (
    <div>
      <InfoBox
        body={morphPartner ? (morphPartner.descriptionBlocks ?? morphPartner.description) : site.informationBox}
        moreHref={morphPartner ? undefined : "/about"}
        showTitle={reveal >= infoTitleAt}
        showBody={reveal >= infoBodyAt}
        opaque={ready || hasVisuals}
        fit
      />
    </div>
  );

  const partnersList = (
    <div>
      <PartnersList
        partners={partners}
        showTitle={reveal >= partnerTitleAt}
        revealedCount={Math.max(0, reveal - (partnerStart - 1))}
        opaque={ready || hasVisuals}
        activeSlug={activeSlug}
        onHover={interactive ? onPartnerHover : undefined}
        onSelect={interactive ? handleSelect : undefined}
        collapsed={morphing}
        collapsedHeight={1}
        transitionMs={ROUTE_MORPH_MS}
        transitionEase={ROUTE_MORPH_EASE}
        locked={morphing || !logosReady}
      />
    </div>
  );

  return (
    <div ref={pageRef} className="paper-grain relative min-h-screen bg-cream">
      <Loader visible={phase === "loader"} />

      {phase === "hero" && introRect ? (
        <IntroSequence
          rect={introRect}
          line={site.introLine}
          onTurn={handleIntroTurn}
          onLand={handleIntroLand}
        />
      ) : null}

      <div
        className="paper-grain visual-viewport-fixed pointer-events-none z-0 isolate overflow-hidden bg-cream"
        aria-hidden
      >
        {previewPartner?.images[0] ? (
          <Image
            src={previewPartner.images[0]}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : null}
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-0 isolate overflow-hidden"
        aria-hidden
      >
        {stamps.map((stamp) => (
          <LogoStamp key={stamp.id} placement={stamp.placement} />
        ))}
      </div>

      <div
        className={`z-10 flex justify-center ${
          morphing
            ? "visual-viewport-fixed items-center"
            : "relative min-h-screen items-start"
        } ${
          phase === "loader" ? "opacity-0" : "opacity-100"
        }`}
      >
        <aside
          ref={asideRef}
          className="flex w-full max-w-[375px] flex-col space-y-[-1px] px-5 py-5 max-[599px]:max-w-none"
          onPointerLeave={handleContainerLeave}
        >
          <div
            ref={addressRef}
            className="order-1"
            style={{ visibility: addressIn ? "visible" : "hidden" }}
          >
            <AddressBox
              showLogo={reveal >= ADDRESS_REVEAL}
              opaque={ready || hasVisuals}
              logo={
                morphPartner
                  ? {
                      src: morphPartner.stampLogo,
                      alt: morphPartner.name,
                    }
                  : undefined
              }
              logoHandoff={logoHandoff}
            />
          </div>

          <div
            className="order-2"
            style={{ visibility: modulesIn > 0 ? "visible" : "hidden" }}
          >
            {infoBox}
          </div>
          <div
            className="order-3"
            style={{ visibility: modulesIn > 1 ? "visible" : "hidden" }}
          >
            {partnersList}
          </div>

          <div
            className="order-4"
            style={{ visibility: modulesIn > 2 ? "visible" : "hidden" }}
          >
            <ContactLinks
              revealedCount={
                morphPartner
                  ? undefined
                  : Math.max(0, reveal - (contactStart - 1))
              }
              opaque={ready || hasVisuals}
              title="CONTACT"
              rows={
                morphPartner
                  ? partnerContactRows(morphPartner.links)
                  : undefined
              }
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
