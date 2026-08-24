"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressBox } from "@/components/AddressBox";
import { ContactLinks, partnerContactRows } from "@/components/ContactLinks";
import { InfoBox } from "@/components/InfoBox";
import { Loader } from "@/components/Loader";
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
  getSilkscreenPrinter,
  PRINT_IN,
  PRINT_IN_MS,
  UNPRINT,
  UNPRINT_MS,
  type SilkscreenPrinter,
} from "@/lib/silkscreen-gl";
import { site } from "@/lib/site";

type Phase = "loader" | "intro" | "ready";

const LOADER_MS = 900;
const CONTENT_PAUSE_MS = 80;
const CONTENT_STAGGER_MS = 40;
const BOX_REVEAL = 4;
/** Set to true to restore the horse intro loader. */
const SHOW_HORSE_LOADER = false;

const LINGER_MS = 150;
const IDLE_MS = 4000;
const CYCLE_MS = 1800;
const MAX_PLATES = 8;

type Plate = {
  id: number;
  slug: string;
  url: string;
  bitmap: ImageBitmap;
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
    hasAppBooted() ? "ready" : SHOW_HORSE_LOADER ? "loader" : "intro",
  );
  const [reveal, setReveal] = useState(() =>
    hasAppBooted() ? maxReveal : BOX_REVEAL,
  );
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [morphPartner, setMorphPartner] = useState<Partner | null>(null);
  const [listVisible, setListVisible] = useState<number | null>(null);
  const [headerLabel, setHeaderLabel] = useState(true);
  const [morphLogo, setMorphLogo] = useState(false);
  const [plates, setPlates] = useState<Plate[]>([]);
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
  const cycleTimerRef = useRef(0);
  const cyclingRef = useRef(false);
  const cycleIndexRef = useRef(0);
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
    for (const partner of partners) {
      const url = partner.images[0];
      if (url) void printer?.print(url, PRINT_IN[0], 0);
    }
  }, [partners]);

  useEffect(
    () => () => {
      morphTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(idleTimerRef.current);
      window.clearTimeout(cycleTimerRef.current);
      lingerTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      lingerTimersRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    const alreadyBooted = hasAppBooted();
    markAppBooted();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (alreadyBooted || reduceMotion) {
      setReveal(maxReveal);
      setPhase("ready");
      return;
    }

    let step = BOX_REVEAL;
    let timer = 0;
    const startIntro = () => {
      setPhase("intro");
      const tick = () => {
        step += 1;
        setReveal(step);
        if (step >= maxReveal) {
          setPhase("ready");
          return;
        }
        timer = window.setTimeout(tick, CONTENT_STAGGER_MS);
      };
      timer = window.setTimeout(tick, CONTENT_PAUSE_MS);
    };

    if (!SHOW_HORSE_LOADER) {
      startIntro();
      return () => window.clearTimeout(timer);
    }

    setPhase("loader");
    const loader = window.setTimeout(startIntro, LOADER_MS);

    return () => {
      window.clearTimeout(loader);
      window.clearTimeout(timer);
    };
  }, [maxReveal]);

  const ready = phase === "ready";
  const partnerStart = 7;
  const infoTitleAt = partnerStart + partners.length;
  const infoBodyAt = infoTitleAt + 1;
  const contactStart = infoBodyAt + 1;

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

  const stopIdle = () => {
    window.clearTimeout(idleTimerRef.current);
    window.clearTimeout(cycleTimerRef.current);
    idleTimerRef.current = 0;
    cycleTimerRef.current = 0;
    cyclingRef.current = false;
  };

  const runCycleTick = () => {
    if (!cyclingRef.current || lockedRef.current) return;
    const list = partnersRef.current;
    if (!list.length) return;
    const index = cycleIndexRef.current;
    hoverRef.current(list[index].slug);
    if (index >= list.length - 1) {
      cyclingRef.current = false;
      cycleTimerRef.current = window.setTimeout(() => {
        if (lockedRef.current) return;
        hoverRef.current(null);
        armIdle();
      }, CYCLE_MS);
      return;
    }
    cycleIndexRef.current = index + 1;
    cycleTimerRef.current = window.setTimeout(runCycleTick, CYCLE_MS);
  };

  const armIdle = () => {
    stopIdle();
    if (lockedRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    idleTimerRef.current = window.setTimeout(() => {
      cyclingRef.current = true;
      cycleIndexRef.current = 0;
      runCycleTick();
    }, IDLE_MS);
  };

  const onPartnerHover = (slug: string | null) => {
    if (slug) {
      stopIdle();
      handleHover(slug);
      return;
    }
    handleHover(null);
    if (!lockedRef.current) armIdle();
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

  // Keep the idle cycle pointed at the latest handlers without restarting it.
  useEffect(() => {
    partnersRef.current = partners;
    hoverRef.current = handleHover;
    stopIdleRef.current = stopIdle;
    armIdleRef.current = armIdle;
  });

  useEffect(() => {
    if (phase !== "ready" || locked) return;
    armIdleRef.current();
    return () => stopIdleRef.current();
  }, [phase, locked]);

  const interactive = !locked && phase !== "loader";
  const hasPlates = plates.length > 0;
  const morphing = morphPartner != null;

  return (
    <div className="relative min-h-screen bg-cream">
      <Loader visible={phase === "loader"} />

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
      </div>

      <div
        className={`relative z-10 flex min-h-screen ${
          phase === "loader" ? "opacity-0" : "opacity-100"
        }`}
      >
        <aside className="flex w-full max-w-[375px] flex-col gap-[5px] px-5 py-5 max-[599px]:max-w-none">
          <div>
            <AddressBox
              showLogo={reveal >= 5}
              opaque={ready || hasPlates}
              collapsed={morphing}
            />
          </div>

          <div>
            <PartnersList
              partners={partners}
              showTitle={reveal >= 6}
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

          <div>
            <InfoBox
              body={morphPartner ? morphPartner.description : site.information}
              showTitle={reveal >= infoTitleAt}
              showBody={reveal >= infoBodyAt}
              opaque={ready || hasPlates}
            />
          </div>

          <div>
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
