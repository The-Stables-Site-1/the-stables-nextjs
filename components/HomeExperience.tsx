"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressBox } from "@/components/AddressBox";
import { ContactLinks } from "@/components/ContactLinks";
import { HeroShader, type HeroShaderHandle } from "@/components/HeroShader";
import { InfoBox } from "@/components/InfoBox";
import { Loader } from "@/components/Loader";
import { PartnersList } from "@/components/PartnersList";
import { hasAppBooted, markAppBooted } from "@/lib/boot";
import type { Partner } from "@/lib/partners";
import { site } from "@/lib/site";

type Phase = "loader" | "intro" | "ready";

const LOADER_MS = 900;
const CONTENT_PAUSE_MS = 80;
const CONTENT_STAGGER_MS = 40;
const BOX_REVEAL = 4;
/** Set to true to restore the horse intro loader. */
const SHOW_HORSE_LOADER = false;

/** Hover plate: a scaled-down copy of the full-bleed frame, dropped somewhere clear. */
const PLATE_SCALE = 0.42;
const PLATE_MOVE_MS = 520;
const ZOOM_MS = 820;
const ZOOM_EASE = "cubic-bezier(0.66, 0, 0.28, 1)";
const MOVE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLUMN_WIDTH = 375;
const COLUMN_GUTTER = 44;
const EDGE_MARGIN = 28;
const PLATE_COLS = 3;
const PLATE_ROWS = 3;

type Plate = { x: number; y: number; ms: number };

/**
 * Picks a cell in the open area right of the content column, keeping consecutive
 * hovers in different cells so the plate always visibly jumps.
 */
function pickPlate(lastCell: number): { plate: Plate; cell: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const boxW = vw * PLATE_SCALE;
  const boxH = vh * PLATE_SCALE;
  const restLeft = (vw - boxW) / 2;
  const restTop = (vh - boxH) / 2;

  const maxLeft = Math.max(EDGE_MARGIN, vw - boxW - EDGE_MARGIN);
  const minLeft = Math.min(COLUMN_WIDTH + COLUMN_GUTTER, maxLeft);
  const maxTop = Math.max(EDGE_MARGIN, vh - boxH - EDGE_MARGIN);
  const minTop = Math.min(EDGE_MARGIN, maxTop);

  const cells = PLATE_COLS * PLATE_ROWS;
  let cell = Math.floor(Math.random() * cells);
  if (cell === lastCell) {
    cell = (cell + 1 + Math.floor(Math.random() * (cells - 1))) % cells;
  }

  const col = cell % PLATE_COLS;
  const row = Math.floor(cell / PLATE_COLS);
  const left =
    minLeft + (maxLeft - minLeft) * ((col + Math.random()) / PLATE_COLS);
  const top = minTop + (maxTop - minTop) * ((row + Math.random()) / PLATE_ROWS);

  return {
    plate: {
      x: Math.round(left - restLeft),
      y: Math.round(top - restTop),
      ms: PLATE_MOVE_MS,
    },
    cell,
  };
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
  const [zooming, setZooming] = useState(false);
  const [plate, setPlate] = useState<Plate>({ x: 0, y: 0, ms: 0 });
  const shaderRef = useRef<HeroShaderHandle>(null);
  const lastCellRef = useRef(-1);
  const zoomTimerRef = useRef(0);
  const router = useRouter();

  useEffect(() => () => window.clearTimeout(zoomTimerRef.current), []);

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
  const partnerStart = 9;
  const contactStart = partnerStart + partners.length;

  const heroUrl = useMemo(() => {
    if (!activeSlug) return null;
    return partners.find((p) => p.slug === activeSlug)?.images[0] ?? null;
  }, [activeSlug, partners]);

  const imageOrder = useMemo(
    () =>
      partners
        .map((partner) => partner.images[0])
        .filter((url): url is string => Boolean(url)),
    [partners],
  );

  const handleHover = (slug: string | null) => {
    if (slug && slug !== activeSlug) {
      const next = pickPlate(lastCellRef.current);
      lastCellRef.current = next.cell;
      // Land in place on first appearance; glide between partners after that.
      setPlate({ ...next.plate, ms: activeSlug ? next.plate.ms : 0 });
    }
    setActiveSlug(slug);
  };

  const handleSelect = (slug: string) => {
    const href = `/partners/${slug}`;
    setLocked(true);
    setActiveSlug(slug);

    const url =
      partners.find((partner) => partner.slug === slug)?.images[0] ?? null;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!url || reduceMotion) {
      router.push(href);
      return;
    }

    setZooming(true);
    router.prefetch(href);
    shaderRef.current?.revealColor(url);
    zoomTimerRef.current = window.setTimeout(() => router.push(href), ZOOM_MS);
  };

  const interactive = !locked && phase !== "loader";
  const plateTransform = zooming
    ? "translate3d(0px, 0px, 0px) scale(1)"
    : `translate3d(${plate.x}px, ${plate.y}px, 0px) scale(${PLATE_SCALE})`;

  return (
    <div className="relative min-h-screen bg-cream">
      <Loader visible={phase === "loader"} />

      <HeroShader
        ref={shaderRef}
        imageUrl={heroUrl}
        imageOrder={imageOrder}
        visible={Boolean(heroUrl) || locked}
        transform={plateTransform}
        transitionMs={zooming ? ZOOM_MS : plate.ms}
        easing={zooming ? ZOOM_EASE : MOVE_EASE}
      />

      <div
        className={`relative z-10 flex min-h-screen ${
          phase === "loader" ? "opacity-0" : "opacity-100"
        }`}
        style={{ perspective: "1100px" }}
      >
        <aside
          className={`flex w-full max-w-[375px] flex-col gap-[20px] px-5 py-5 ${
            zooming ? "pointer-events-none" : ""
          }`}
          style={{
            transform: zooming
              ? "translate3d(0px, -12px, 460px)"
              : "translate3d(0px, 0px, 0px)",
            opacity: zooming ? 0 : 1,
            transition: `transform ${ZOOM_MS}ms ${ZOOM_EASE}, opacity ${Math.round(
              ZOOM_MS * 0.7,
            )}ms ease-in ${Math.round(ZOOM_MS * 0.22)}ms`,
            willChange: "transform",
          }}
        >
          <div>
            <AddressBox showLogo={reveal >= 5} opaque={ready || Boolean(activeSlug)} />
          </div>

          <div>
            <InfoBox
              body={site.information}
              showTitle={reveal >= 6}
              showBody={reveal >= 7}
              opaque={ready || Boolean(activeSlug)}
            />
          </div>

          <div>
            <PartnersList
              partners={partners}
              showTitle={reveal >= 8}
              revealedCount={Math.max(0, reveal - (partnerStart - 1))}
              opaque={ready || Boolean(activeSlug)}
              activeSlug={activeSlug}
              onHover={interactive ? handleHover : undefined}
              onSelect={interactive ? handleSelect : undefined}
            />
          </div>

          <div>
            <ContactLinks
              revealedCount={Math.max(0, reveal - (contactStart - 1))}
              opaque={ready || Boolean(activeSlug)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
