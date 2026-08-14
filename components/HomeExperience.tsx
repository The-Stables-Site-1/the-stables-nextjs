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
const BOX_STAGGER_MS = 55;
const CONTENT_PAUSE_MS = 80;
const CONTENT_STAGGER_MS = 40;

type HomeExperienceProps = {
  partners: Partner[];
};

export function HomeExperience({ partners }: HomeExperienceProps) {
  const contentSteps = 1 + 2 + 1 + partners.length + 4;
  const maxReveal = 4 + contentSteps;

  const [phase, setPhase] = useState<Phase>("loader");
  const [reveal, setReveal] = useState(0);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const shaderRef = useRef<HeroShaderHandle>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const skipLoader = hasAppBooted();
    markAppBooted();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setReveal(maxReveal);
      setPhase("ready");
      return;
    }

    let step = 0;
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
        const delay =
          step < 4 ? BOX_STAGGER_MS : step === 4 ? CONTENT_PAUSE_MS : CONTENT_STAGGER_MS;
        timer = window.setTimeout(tick, delay);
      };
      timer = window.setTimeout(tick, BOX_STAGGER_MS);
    };

    if (skipLoader) {
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

  if (!mounted) {
    return <div className="relative min-h-screen bg-cream" />;
  }

  return (
    <div className="relative min-h-screen bg-cream">
      <Loader visible={phase === "loader"} />

      <HeroShader
        ref={shaderRef}
        imageUrl={heroUrl}
        imageOrder={imageOrder}
        visible={Boolean(heroUrl) || locked}
      />

      <div
        className={`relative z-10 flex min-h-screen ${
          phase === "loader" ? "opacity-0" : "opacity-100"
        }`}
      >
        <aside className="flex w-full max-w-[375px] flex-col gap-[20px] px-5 py-5">
          <div
            className={reveal >= 1 ? "opacity-100" : "opacity-0"}
          >
            <AddressBox showLogo={reveal >= 5} opaque={ready || Boolean(activeSlug)} />
          </div>

          <div
            className={reveal >= 2 ? "opacity-100" : "opacity-0"}
          >
            <InfoBox
              body={site.information}
              showTitle={reveal >= 6}
              showBody={reveal >= 7}
              opaque={ready || Boolean(activeSlug)}
            />
          </div>

          <div
            className={reveal >= 3 ? "opacity-100" : "opacity-0"}
          >
            <PartnersList
              partners={partners}
              showTitle={reveal >= 8}
              revealedCount={Math.max(0, reveal - (partnerStart - 1))}
              opaque={ready || Boolean(activeSlug)}
              activeSlug={activeSlug}
              onHover={!locked && phase !== "loader" ? setActiveSlug : undefined}
              onSelect={
                !locked && phase !== "loader"
                  ? (slug) => {
                      setLocked(true);
                      setActiveSlug(slug);
                      const url =
                        partners.find((partner) => partner.slug === slug)
                          ?.images[0] ?? null;
                      if (!url) {
                        router.push(`/partners/${slug}`);
                        return;
                      }
                      router.prefetch(`/partners/${slug}`);
                      shaderRef.current?.revealColor(url, () => {
                        router.push(`/partners/${slug}`);
                      });
                    }
                  : undefined
              }
            />
          </div>

          <div
            className={reveal >= 4 ? "opacity-100" : "opacity-0"}
          >
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
