"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  HEADER_OFF_MS,
  ITEM_STAGGER_OUT_MS,
  LOGO_HOLD_MS,
  MORPH_MS,
  STAMP_ART_H,
  STAMP_ART_W,
} from "@/lib/morph";
import type { Partner } from "@/lib/partners";
import {
  disposeSilkscreenPrinter,
  getSilkscreenPrinter,
  peekPrinted,
  type SilkscreenPrinter,
} from "@/lib/silkscreen-gl";
import { site } from "@/lib/site";
import {
  placeOneStamp,
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
/** Set to true to restore the horse intro loader. */
const SHOW_HORSE_LOADER = false;

const IDLE_MS = 1500;

/** Idle stamping cadence: one impression at a time, never lifted. */
const STAMP_GAP_MS = 600;
/** Ceiling on accumulated impressions, so the page cannot grow forever. */
const MAX_STAMPS = 16;

const randomSeed = () => (Math.random() * 0xffffffff) >>> 0;

type Plate = {
  id: number;
  slug: string;
  url: string;
  bitmap: ImageBitmap;
};

type StampInstance = {
  id: number;
  placement: StampPlacement;
};

function StampCanvas({ bitmap }: { bitmap: ImageBitmap }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.width !== bitmap.width || el.height !== bitmap.height) {
      el.width = bitmap.width;
      el.height = bitmap.height;
    }
    const ctx = el.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.drawImage(bitmap, 0, 0);
  }, [bitmap]);
  return <canvas ref={ref} className="h-full w-full object-cover" />;
}

type HomeExperienceProps = {
  partners: Partner[];
};

export function HomeExperience({ partners }: HomeExperienceProps) {
  const contentSteps = 1 + 2 + 1 + partners.length + 4;
  const maxReveal = 4 + contentSteps;

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
  const addressRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const introTimersRef = useRef<number[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [morphPartner, setMorphPartner] = useState<Partner | null>(null);
  const [listVisible, setListVisible] = useState<number | null>(null);
  const [headerLabel, setHeaderLabel] = useState(true);
  const [morphLogo, setMorphLogo] = useState(false);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [stamps, setStamps] = useState<StampInstance[]>([]);
  const nextPlateIdRef = useRef(1);
  const morphTimersRef = useRef<number[]>([]);
  const lockedRef = useRef(false);
  const printerRef = useRef<SilkscreenPrinter | null>(null);
  const idleTimerRef = useRef(0);
  const stampTimerRef = useRef(0);
  const stampRunRef = useRef(0);
  const stampCountRef = useRef(0);
  const nextStampIdRef = useRef(1);
  const logosRef = useRef<StampLogo[]>([]);
  const activeSlugRef = useRef<string | null>(null);
  const partnersRef = useRef(partners);
  const hoverRef = useRef<(slug: string | null) => void>(() => {});
  const stopIdleRef = useRef(() => {});
  const armIdleRef = useRef(() => {});
  const router = useRouter();

  useEffect(() => {
    const printer = getSilkscreenPrinter();
    printerRef.current = printer;
    if (!printer) return;

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
    })();

    return () => {
      alive = false;
    };
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
        introTimersRef.current.push(
          window.setTimeout(tick, CONTENT_STAGGER_MS),
        );
      };
      introTimersRef.current.push(window.setTimeout(tick, CONTENT_PAUSE_MS));
    },
    [maxReveal],
  );

  useEffect(() => {
    const alreadyBooted = hasAppBooted();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (alreadyBooted || reduceMotion) {
      markAppBooted();
      setReveal(maxReveal);
      setAddressIn(true);
      setModulesIn(MODULE_COUNT);
      setPhase("ready");
      return;
    }

    if (!SHOW_HORSE_LOADER) {
      setPhase("hero");
      return;
    }

    setPhase("loader");
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
  const infoTitleAt = 6;
  const infoBodyAt = infoTitleAt + 1;
  const partnerTitleAt = infoBodyAt + 1;
  const partnerStart = partnerTitleAt + 1;
  const contactStart = partnerStart + partners.length;

  const stampViewport = () => {
    const column = asideRef.current?.getBoundingClientRect();
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      seed: randomSeed(),
      avoid: column
        ? {
            x: column.left,
            y: column.top,
            w: column.width,
            // Idle stamps live on the z-0 layer, behind the opaque z-10 content
            // column, so anything under the column is hidden anyway. The keep-out
            // rect only needs to cover roughly the collapsed column height; when
            // the fit INFORMATION box grows the column taller, clamping the
            // height stops that growth from shrinking (starving) the placeable
            // area. Any stamp behind the grown box stays hidden, so this cannot
            // print over the readable text. Cap ~= pre-fit column height
            // (address + info + partners + contact).
            h: Math.min(column.height, 600),
          }
        : null,
    };
  };

  const pressStamp = (logo: StampLogo) => {
    const placement = placeOneStamp({ logo, ...stampViewport() });
    if (!placement) return;
    const id = nextStampIdRef.current;
    nextStampIdRef.current += 1;
    setStamps((current) => {
      const next = [...current, { id, placement }];
      const trimmed =
        next.length > MAX_STAMPS ? next.slice(-MAX_STAMPS) : next;
      stampCountRef.current = trimmed.length;
      return trimmed;
    });
  };

  const handleHover = (slug: string | null) => {
    if (slug === activeSlug) return;
    setActiveSlug(slug);
    if (!slug) return;
    router.prefetch(`/partners/${slug}`);

    const partner = partners.find((item) => item.slug === slug);
    if (!partner?.stampLogo) return;

    const existing =
      logosRef.current.find((item) => item.slug === slug) ??
      logosRef.current.find((item) => item.src === partner.stampLogo);
    if (existing) {
      pressStamp({ ...existing, slug: partner.slug, name: partner.name });
      return;
    }

    void (async () => {
      const size = await printerRef.current?.preload(partner.stampLogo);
      if (!size || activeSlugRef.current !== slug) return;
      const logo = {
        slug: partner.slug,
        name: partner.name,
        src: partner.stampLogo,
        aspect: size.w / Math.max(size.h, 1),
      };
      logosRef.current = [...logosRef.current, logo];
      pressStamp(logo);
    })();
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
        plan = planStampField({ logos: logosRef.current, ...stampViewport() });
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
    if (slug) stopIdle();
    handleHover(slug);
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
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!url || reduceMotion) {
      router.push(href);
      return;
    }

    const bitmap = peekPrinted(url);
    if (bitmap) {
      const id = nextPlateIdRef.current;
      nextPlateIdRef.current += 1;
      setPlates([{ id, slug, url, bitmap }]);
    }

    router.prefetch(href);
    setMorphPartner(partner);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const tw = Math.max(1, Math.round(STAMP_ART_W * dpr));
    const th = Math.max(1, Math.round(STAMP_ART_H * dpr));
    if (partner.stampLogo) {
      void printerRef.current?.printStamp(
        partner.stampLogo,
        tw,
        th,
        1,
        true,
      );
    }

    const after = (ms: number, run: () => void) => {
      morphTimersRef.current.push(window.setTimeout(run, ms));
    };

    const total = partners.length;
    for (let i = 0; i < total; i += 1) {
      after(ITEM_STAGGER_OUT_MS * (i + 1), () => setListVisible(total - i - 1));
    }

    const rowsGone = ITEM_STAGGER_OUT_MS * total + HEADER_OFF_MS;
    after(rowsGone, () => setHeaderLabel(false));

    const logoAt = Math.max(rowsGone, MORPH_MS);
    after(logoAt, () => setMorphLogo(true));
    after(logoAt + LOGO_HOLD_MS, () => router.push(href));
  };

  // Keep the idle loop pointed at the latest handlers without restarting it.
  useEffect(() => {
    partnersRef.current = partners;
    activeSlugRef.current = activeSlug;
    hoverRef.current = handleHover;
    stopIdleRef.current = stopIdle;
    armIdleRef.current = armIdle;
  });

  // Hovering pauses idle stamping; impressions stay on the sheet and the
  // loop restarts once the pointer leaves. Hidden tabs do not keep printing.
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

  const interactive = !locked && phase !== "loader" && phase !== "hero";
  const hasPlates = plates.length > 0 || stamps.length > 0;
  const morphing = morphPartner != null;

  const infoBox = (
    <div>
      <InfoBox
        body={morphPartner ? morphPartner.description : site.informationBox}
        moreHref={morphPartner ? undefined : "/about"}
        showTitle={reveal >= infoTitleAt}
        showBody={reveal >= infoBodyAt}
        opaque={ready || hasPlates}
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
        opaque={ready || hasPlates}
        activeSlug={activeSlug}
        onHover={interactive ? onPartnerHover : undefined}
        onSelect={interactive ? handleSelect : undefined}
        collapsed={morphing}
        visibleCount={listVisible ?? undefined}
        showHeaderLabel={headerLabel}
        logo={
          morphPartner && morphLogo
            ? { src: morphPartner.stampLogo, alt: morphPartner.name }
            : null
        }
      />
    </div>
  );

  return (
    <div className="relative min-h-screen bg-cream">
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
        className="pointer-events-none fixed inset-0 z-0 isolate overflow-hidden bg-cream"
        aria-hidden
      >
        {plates.map((plate) => (
          <div
            key={plate.id}
            className="absolute inset-0 overflow-hidden"
            style={{ mixBlendMode: "darken" }}
          >
            <StampCanvas bitmap={plate.bitmap} />
          </div>
        ))}

        {stamps.map((stamp) => (
          <LogoStamp key={stamp.id} placement={stamp.placement} />
        ))}
      </div>

      <div
        className={`relative z-10 flex min-h-screen items-center justify-center ${
          phase === "loader" ? "opacity-0" : "opacity-100"
        }`}
      >
        <aside
          ref={asideRef}
          className="flex w-full max-w-[375px] flex-col space-y-[-1px] px-5 py-5 max-[599px]:max-w-none"
        >
          <div
            ref={addressRef}
            className="order-1"
            style={{ visibility: addressIn ? "visible" : "hidden" }}
          >
            <AddressBox
              showLogo={reveal >= ADDRESS_REVEAL}
              opaque={ready || hasPlates}
              collapsed={morphing}
            />
          </div>

          <div
            className={morphing ? "order-3" : "order-2"}
            style={{ visibility: modulesIn > 0 ? "visible" : "hidden" }}
          >
            {infoBox}
          </div>
          <div
            className={morphing ? "order-2" : "order-3"}
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
              opaque={ready || hasPlates}
              title={morphPartner ? "INQUIRE" : "CONTACT"}
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
