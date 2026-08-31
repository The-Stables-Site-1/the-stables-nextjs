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
} from "@/lib/morph";
import type { Partner } from "@/lib/partners";
import {
  disposeSilkscreenPrinter,
  getSilkscreenPrinter,
  PRINT_IN,
  PRINT_IN_MS,
  UNPRINT,
  UNPRINT_MS,
  type SilkscreenPrinter,
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
/** Set to true to restore the horse intro loader. */
const SHOW_HORSE_LOADER = false;

const LINGER_MS = 150;
const IDLE_MS = 4000;
const MAX_PLATES = 8;

/** Idle stamping cadence: one impression at a time, never lifted. */
const STAMP_GAP_MS = 1500;
/** Ceiling on accumulated impressions, so the page cannot grow forever. */
const MAX_STAMPS = 48;

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
  const introTimersRef = useRef<number[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [morphPartner, setMorphPartner] = useState<Partner | null>(null);
  const [listVisible, setListVisible] = useState<number | null>(null);
  const [headerLabel, setHeaderLabel] = useState(true);
  const [morphLogo, setMorphLogo] = useState(false);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [stamps, setStamps] = useState<StampInstance[]>([]);
  const currentPlateIdRef = useRef<number | null>(null);
  const nextPlateIdRef = useRef(1);
  const lingerTimersRef = useRef<Map<number, number>>(new Map());
  const deadIdsRef = useRef(new Set<number>());
  const morphTimersRef = useRef<number[]>([]);
  const lockedRef = useRef(false);
  const printerRef = useRef<SilkscreenPrinter | null>(null);
  const urlByIdRef = useRef<Map<number, string>>(new Map());
  const progressByIdRef = useRef<Map<number, number>>(new Map());
  const stopInRef = useRef(new Set<number>());
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

  const clearLinger = (id: number) => {
    const timer = lingerTimersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    lingerTimersRef.current.delete(id);
  };

  const setPlateSrc = (id: number, bitmap: ImageBitmap) => {
    setPlates((current) =>
      current.map((plate) => (plate.id === id ? { ...plate, bitmap } : plate)),
    );
  };

  const removePlate = (id: number) => {
    deadIdsRef.current.add(id);
    stopInRef.current.add(id);
    clearLinger(id);
    urlByIdRef.current.delete(id);
    progressByIdRef.current.delete(id);
    setPlates((current) => current.filter((plate) => plate.id !== id));
  };

  const unprintPlate = (id: number) => {
    stopInRef.current.add(id);
    clearLinger(id);
    const url = urlByIdRef.current.get(id);
    const printer = printerRef.current;
    if (!url || !printer) {
      removePlate(id);
      return;
    }

    void (async () => {
      const from = progressByIdRef.current.get(id) ?? 1;
      const steps = UNPRINT.filter((progress) => progress < from - 0.03);
      const ladder = steps.length ? steps : [0];
      await Promise.all(
        ladder.map((progress) => printer.print(url, progress, 0, true)),
      );
      for (let i = 0; i < ladder.length; i += 1) {
        if (deadIdsRef.current.has(id) || lockedRef.current) return;
        const src = printer.peek(url, ladder[i], 0);
        if (!src) continue;
        progressByIdRef.current.set(id, ladder[i]);
        setPlateSrc(id, src);
        await new Promise((resolve) =>
          window.setTimeout(resolve, UNPRINT_MS[Math.min(i, UNPRINT_MS.length - 1)]),
        );
      }
      if (!deadIdsRef.current.has(id) && !lockedRef.current) removePlate(id);
    })();
  };

  const lingerPlate = (id: number) => {
    stopInRef.current.add(id);
    clearLinger(id);
    const timer = window.setTimeout(() => {
      lingerTimersRef.current.delete(id);
      unprintPlate(id);
    }, LINGER_MS);
    lingerTimersRef.current.set(id, timer);
  };

  useEffect(() => {
    const printer = getSilkscreenPrinter();
    printerRef.current = printer;
    if (!printer) return;
    for (const partner of partners) {
      const url = partner.images[0];
      if (url) void printer.print(url, PRINT_IN[0], 0);
    }

    let alive = true;
    const seen = new Set<string>();
    void (async () => {
      for (const partner of partners) {
        if (!partner.stampLogo || seen.has(partner.stampLogo)) continue;
        seen.add(partner.stampLogo);
        const size = await printer.preload(partner.stampLogo);
        if (!alive) return;
        if (!size) continue;
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
      lingerTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      lingerTimersRef.current.clear();
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

  const pushPlate = (plate: Plate) => {
    setPlates((current) => {
      const kept =
        current.length >= MAX_PLATES ? current.slice(-(MAX_PLATES - 1)) : current;
      if (kept.length < current.length) {
        const keptIds = new Set(kept.map((item) => item.id));
        current.forEach((item) => {
          if (!keptIds.has(item.id)) clearLinger(item.id);
        });
      }
      return [...kept, plate];
    });
  };

  const handleHover = (slug: string | null) => {
    if (slug === activeSlug) return;

    if (currentPlateIdRef.current != null) {
      if (slug) lingerPlate(currentPlateIdRef.current);
      else unprintPlate(currentPlateIdRef.current);
      currentPlateIdRef.current = null;
    }

    setActiveSlug(slug);
    if (!slug) return;

    const url = partners.find((partner) => partner.slug === slug)?.images[0];
    if (!url) return;

    const id = nextPlateIdRef.current;
    nextPlateIdRef.current += 1;
    currentPlateIdRef.current = id;
    urlByIdRef.current.set(id, url);
    stopInRef.current.delete(id);
    progressByIdRef.current.set(id, 0);

    void (async () => {
      const printer = printerRef.current;
      if (!printer) return;
      await Promise.all(
        PRINT_IN.map((progress) => printer.print(url, progress, 0, true)),
      );
      if (
        stopInRef.current.has(id) ||
        deadIdsRef.current.has(id) ||
        lockedRef.current
      ) {
        return;
      }
      for (const progress of UNPRINT) void printer.print(url, progress, 0);
      for (let i = 0; i < PRINT_IN.length; i += 1) {
        if (
          stopInRef.current.has(id) ||
          deadIdsRef.current.has(id) ||
          lockedRef.current
        ) {
          return;
        }
        const src = printer.peek(url, PRINT_IN[i], 0);
        if (!src) continue;
        progressByIdRef.current.set(id, PRINT_IN[i]);
        if (i === 0) {
          pushPlate({ id, slug, url, bitmap: src });
        } else {
          setPlateSrc(id, src);
        }
        await new Promise((resolve) =>
          window.setTimeout(resolve, PRINT_IN_MS[i]),
        );
      }
    })();
  };

  const clearStamps = () => {
    stampCountRef.current = 0;
    setStamps((current) => (current.length ? [] : current));
  };

  const stopIdle = () => {
    window.clearTimeout(idleTimerRef.current);
    window.clearTimeout(stampTimerRef.current);
    idleTimerRef.current = 0;
    stampTimerRef.current = 0;
    stampRunRef.current += 1;
    clearStamps();
  };

  /**
   * Presses one logo at a time and leaves every impression on the page. When a
   * layout runs out another is planned, so the sheet keeps filling up.
   */
  const runStampField = () => {
    const run = stampRunRef.current;
    const viewport = () => ({
      logos: logosRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      seed: randomSeed(),
    });

    let plan = planStampField(viewport());
    if (!plan.length) return;
    let index = 0;

    const pressNext = () => {
      if (stampRunRef.current !== run || lockedRef.current) return;
      if (stampCountRef.current >= MAX_STAMPS) return;

      if (index >= plan.length) {
        plan = planStampField(viewport());
        index = 0;
        if (!plan.length) return;
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
    if (lockedRef.current || activeSlugRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const run = stampRunRef.current;
    idleTimerRef.current = window.setTimeout(() => {
      if (stampRunRef.current !== run || lockedRef.current) return;
      runStampField();
    }, IDLE_MS);
  };

  const onPartnerHover = (slug: string | null) => {
    // Wipe the sheet on the spot; the idle effect re-arms once the hover ends.
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

    lingerTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    lingerTimersRef.current.clear();

    // The halftone plate stays exactly where it is; only the modules move.
    setPlates((current) => {
      const latest = [...current].reverse().find((plate) => plate.slug === slug);
      if (latest) {
        currentPlateIdRef.current = latest.id;
        return [latest];
      }

      const bitmap = printerRef.current?.peek(url);
      if (!bitmap) return current;
      const id = nextPlateIdRef.current;
      nextPlateIdRef.current += 1;
      currentPlateIdRef.current = id;
      urlByIdRef.current.set(id, url);
      return [{ id, slug, url, bitmap }];
    });

    router.prefetch(href);
    setMorphPartner(partner);

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

  // Hovering a partner is the only thing that wipes the sheet: it sets
  // activeSlug, which tears the loop down here and restarts it on hover out.
  useEffect(() => {
    if (phase !== "ready" || locked) return;
    armIdleRef.current();
    return () => stopIdleRef.current();
  }, [phase, locked, activeSlug]);

  const interactive = !locked && phase !== "loader" && phase !== "hero";
  const hasPlates = plates.length > 0 || stamps.length > 0;
  const morphing = morphPartner != null;

  const infoBox = (
    <div>
      <InfoBox
        body={morphPartner ? morphPartner.description : site.information}
        moreHref={morphPartner ? undefined : "/about"}
        showTitle={reveal >= infoTitleAt}
        showBody={reveal >= infoBodyAt}
        opaque={ready || hasPlates}
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
        className={`relative z-10 flex min-h-screen justify-center ${
          phase === "loader" ? "opacity-0" : "opacity-100"
        }`}
      >
        <aside className="flex w-full max-w-[375px] flex-col gap-[6px] px-5 py-5 max-[599px]:max-w-none">
          <div
            ref={addressRef}
            style={{ visibility: addressIn ? "visible" : "hidden" }}
          >
            <AddressBox
              showLogo={reveal >= ADDRESS_REVEAL}
              opaque={ready || hasPlates}
              collapsed={morphing}
            />
          </div>

          <div style={{ visibility: modulesIn > 0 ? "visible" : "hidden" }}>
            {infoBox}
          </div>
          <div style={{ visibility: modulesIn > 1 ? "visible" : "hidden" }}>
            {partnersList}
          </div>

          <div style={{ visibility: modulesIn > 2 ? "visible" : "hidden" }}>
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
