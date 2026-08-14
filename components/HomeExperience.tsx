"use client";

import { useEffect, useMemo, useState } from "react";
import { AddressBox } from "@/components/AddressBox";
import { ContactLinks } from "@/components/ContactLinks";
import { HeroShader } from "@/components/HeroShader";
import { InfoBox } from "@/components/InfoBox";
import { Loader } from "@/components/Loader";
import { PartnersList } from "@/components/PartnersList";
import type { Partner } from "@/lib/partners";
import { site } from "@/lib/site";

type Phase = "loader" | "skeleton" | "stagger" | "ready";

const SESSION_KEY = "stables-intro-seen";

type HomeExperienceProps = {
  partners: Partner[];
};

export function HomeExperience({ partners }: HomeExperienceProps) {
  const [phase, setPhase] = useState<Phase>("loader");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const seen =
      typeof window !== "undefined" &&
      sessionStorage.getItem(SESSION_KEY) === "1";

    if (seen) {
      setPhase("ready");
      return;
    }

    const t1 = window.setTimeout(() => setPhase("skeleton"), 900);
    const t2 = window.setTimeout(() => setPhase("stagger"), 1600);
    const t3 = window.setTimeout(() => {
      setPhase("ready");
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 2800);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const showSkeleton = phase !== "loader";
  const showAddressContent = phase === "stagger" || phase === "ready";
  const showRestContent = phase === "ready";
  const opaque = Boolean(activeSlug) || phase === "ready";

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
    return <Loader visible />;
  }

  return (
    <div className="relative min-h-screen bg-cream">
      <Loader visible={phase === "loader"} />

      <HeroShader
        imageUrl={heroUrl}
        imageOrder={imageOrder}
        visible={phase === "ready" && Boolean(heroUrl)}
      />

      <div
        className={`relative z-10 flex min-h-screen transition-opacity duration-500 ${
          showSkeleton ? "opacity-100" : "opacity-0"
        }`}
      >
        <aside className="flex w-full max-w-[375px] flex-col gap-[20px] px-5 py-5">
          <div
            className={`transition-opacity duration-500 ${
              showSkeleton ? "opacity-100" : "opacity-0"
            }`}
          >
            <AddressBox
              showContent={showAddressContent}
              opaque={opaque || Boolean(activeSlug)}
            />
          </div>

          <div
            className={`transition-opacity duration-500 ${
              showSkeleton ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: showRestContent ? "80ms" : "0ms" }}
          >
            <InfoBox
              body={showRestContent ? site.information : undefined}
              showContent={showRestContent}
              opaque={opaque || Boolean(activeSlug)}
            />
          </div>

          <div
            className={`transition-opacity duration-500 ${
              showSkeleton ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: showRestContent ? "160ms" : "0ms" }}
          >
            <PartnersList
              partners={partners}
              showContent={showRestContent}
              opaque={opaque || Boolean(activeSlug)}
              activeSlug={activeSlug}
              onHover={phase === "ready" ? setActiveSlug : undefined}
            />
          </div>

          <div
            className={`transition-opacity duration-500 ${
              showSkeleton ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: showRestContent ? "240ms" : "0ms" }}
          >
            <ContactLinks
              showContent={showRestContent}
              opaque={opaque || Boolean(activeSlug)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
