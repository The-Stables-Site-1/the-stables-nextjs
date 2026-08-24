"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  getSilkscreenPrinter,
  peekPrinted,
  PRINT_IN,
  UNPRINT,
  UNPRINT_MS,
  type SilkscreenPrinter,
} from "@/lib/silkscreen-gl";
import { site } from "@/lib/site";

/** How long each frame holds before the next one prints over it. */
const SLIDE_MS = 4200;
/** Slightly snappier than the home hover ladder so hops don't hitch. */
const SLIDE_IN_MS = [22, 50, 30, 54, 32] as const;

type Slide = {
  id: number;
  url: string;
  bitmap: ImageBitmap;
};

function SlideCanvas({ bitmap }: { bitmap: ImageBitmap }) {
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

function initialSlides(partner: Partner): Slide[] {
  const url = partner.images[0];
  if (!url) return [];
  const bitmap = peekPrinted(url);
  if (!bitmap) return [];
  return [{ id: 1, url, bitmap }];
}

type PartnerExperienceProps = {
  partner: Partner;
};

export function PartnerExperience({ partner }: PartnerExperienceProps) {
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>(() => initialSlides(partner));
  const [leaving, setLeaving] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [listVisible, setListVisible] = useState(0);
  const [headerLabel, setHeaderLabel] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [detailOpen, setDetailOpen] = useState(true);
  const printerRef = useRef<SilkscreenPrinter | null>(null);
  const nextIdRef = useRef(1);
  const indexRef = useRef(0);
  const runRef = useRef(0);
  const timerRef = useRef(0);
  const busyRef = useRef(false);
  const leavingRef = useRef(false);
  const morphTimersRef = useRef<number[]>([]);
  const advanceRef = useRef(() => {});

  useEffect(() => {
    markAppBooted();
    router.prefetch("/");
  }, [router]);

  useEffect(() => {
    const printer = getSilkscreenPrinter();
    printerRef.current = printer;
    const images = partner.images;
    const hero = images[0];
    indexRef.current = 0;
    runRef.current += 1;
    busyRef.current = false;
    if (hero && peekPrinted(hero)) nextIdRef.current = 2;

    const wait = (ms: number) =>
      new Promise((resolve) => window.setTimeout(resolve, ms));

    const warm = (url: string | undefined) => {
      if (!printer || !url) return;
      for (const progress of PRINT_IN) void printer.print(url, progress, 0);
    };

    const schedule = () => {
      window.clearTimeout(timerRef.current);
      if (leavingRef.current || images.length < 2) return;
      timerRef.current = window.setTimeout(
        () => advanceRef.current(),
        SLIDE_MS,
      );
    };

    /** Prints the next frame on top, then drops the one underneath. */
    const show = async (index: number, instant: boolean) => {
      if (!printer || leavingRef.current) return;
      const run = runRef.current;
      const url = images[index];
      if (!url) return;
      const id = nextIdRef.current;
      nextIdRef.current += 1;
      busyRef.current = true;

      if (instant) {
        const already = peekPrinted(url);
        if (already) {
          setSlides((current) =>
            current.some((slide) => slide.url === url)
              ? current
              : [{ id, url, bitmap: already }],
          );
          busyRef.current = false;
          schedule();
          warm(images[1] ?? url);
          return;
        }
        const bitmap = await printer.print(url, 1, 0, true);
        if (!bitmap || run !== runRef.current || leavingRef.current) return;
        setSlides([{ id, url, bitmap }]);
        busyRef.current = false;
        schedule();
        warm(images[1] ?? url);
        return;
      }

      for (let step = 0; step < PRINT_IN.length; step += 1) {
        if (run !== runRef.current || leavingRef.current) return;
        const progress = PRINT_IN[step];
        const bitmap =
          printer.peek(url, progress, 0) ??
          (await printer.print(url, progress, 0, true));
        if (!bitmap || run !== runRef.current || leavingRef.current) return;
        if (step === 0) {
          setSlides((current) => [...current.slice(-1), { id, url, bitmap }]);
        } else {
          setSlides((current) =>
            current.map((slide) =>
              slide.id === id ? { ...slide, bitmap } : slide,
            ),
          );
        }
        await wait(SLIDE_IN_MS[step]);
      }
      if (run !== runRef.current || leavingRef.current) return;
      setSlides((current) => current.filter((slide) => slide.id === id));
      busyRef.current = false;
      schedule();
      warm(images[(index + 1) % images.length]);
    };

    advanceRef.current = () => {
      if (leavingRef.current || busyRef.current || images.length < 2) return;
      window.clearTimeout(timerRef.current);
      indexRef.current = (indexRef.current + 1) % images.length;
      void show(indexRef.current, false);
    };

    void show(0, true);
    for (const src of images.slice(1, 3)) warm(src);

    return () => {
      runRef.current += 1;
      window.clearTimeout(timerRef.current);
    };
  }, [partner]);

  const handleBack = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    window.clearTimeout(timerRef.current);
    runRef.current += 1;
    busyRef.current = false;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      router.push("/");
      return;
    }

    const wait = (ms: number) =>
      new Promise((resolve) => window.setTimeout(resolve, ms));

    const current = slides.at(-1);

    const unprintCurrent = async () => {
      const printer = printerRef.current;
      if (!printer || !current) {
        setSlides([]);
        return;
      }
      setSlides([current]);
      for (let i = 0; i < UNPRINT.length; i += 1) {
        if (!leavingRef.current) return;
        const progress = UNPRINT[i];
        const bitmap =
          printer.peek(current.url, progress, 0) ??
          (await printer.print(current.url, progress, 0, true));
        if (bitmap) {
          setSlides([{ id: current.id, url: current.url, bitmap }]);
        }
        await wait(UNPRINT_MS[Math.min(i, UNPRINT_MS.length - 1)]);
      }
      setSlides([]);
    };

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
    void (async () => {
      await Promise.all([unprintCurrent(), wait(doneAt)]);
      if (leavingRef.current) router.push("/");
    })();
  };

  useEffect(
    () => () => {
      morphTimersRef.current.forEach((timer) => window.clearTimeout(timer));
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
          advanceRef.current();
        }}
        className="absolute inset-0 z-0 block cursor-pointer bg-cream"
      >
        <span className="sr-only">Next image</span>
        <span className="pointer-events-none absolute inset-0 isolate" aria-hidden>
          {slides.map((slide) => (
            <span
              key={slide.id}
              className="absolute inset-0 block overflow-hidden"
              style={{ mixBlendMode: "darken" }}
            >
              <SlideCanvas bitmap={slide.bitmap} />
            </span>
          ))}
        </span>
      </button>

      <div className="pointer-events-none absolute inset-0 z-20">
        <aside className="pointer-events-none absolute top-0 left-0 flex h-full max-h-full w-full max-w-[375px] flex-col px-5 py-5 max-[599px]:max-w-none">
          <div className="pointer-events-auto flex max-h-full flex-col gap-[5px] overflow-y-auto overscroll-none">
            <div className="shrink-0">
              <AddressBox
                collapsed={collapsed}
                href="/"
                onBack={handleBack}
              />
            </div>

            <div className="shrink-0">
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

            <div className="shrink-0">
              <InfoBox
                body={
                  homeContent ? site.information : partner.description
                }
                open={detailOpen}
                onOpenChange={setDetailOpen}
              />
            </div>

            <div className="shrink-0">
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
