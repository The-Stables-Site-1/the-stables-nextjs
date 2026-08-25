"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StampBox } from "@/components/StampBox";
import {
  BOX_BORDER,
  MORPH_EASE,
  MORPH_MS,
  partnersOpenHeight,
  ROW_H,
  STAMP_BOX_H,
} from "@/lib/morph";
import type { Partner } from "@/lib/partners";

type PartnersListProps = {
  partners: Partner[];
  showTitle?: boolean;
  revealedCount?: number;
  opaque?: boolean;
  activeSlug?: string | null;
  onHover?: (slug: string | null) => void;
  onSelect?: (slug: string) => void;
  /** Slides down to a 138px module that holds the partner stamp. */
  collapsed?: boolean;
  /** Rows still on the page while they peel away one by one. */
  visibleCount?: number;
  showHeaderLabel?: boolean;
  logo?: { src: string; alt: string } | null;
  locked?: boolean;
  onLogoClick?: () => void;
};

export function PartnersList({
  partners,
  showTitle = true,
  revealedCount = partners.length,
  opaque = false,
  activeSlug = null,
  onHover,
  onSelect,
  collapsed = false,
  visibleCount,
  showHeaderLabel = true,
  logo = null,
  locked = false,
  onLogoClick,
}: PartnersListProps) {
  const [open, setOpen] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const handleEnter = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest(
        "[data-partner-slug]",
      ) as HTMLElement | null;
      if (!target) return;
      const slug = target.dataset.partnerSlug;
      if (slug) onHoverRef.current?.(slug);
    };

    const handleLeave = (event: Event) => {
      const related = (event as MouseEvent).relatedTarget as Node | null;
      if (related && list.contains(related)) return;
      onHoverRef.current?.(null);
    };

    list.addEventListener("pointerover", handleEnter);
    list.addEventListener("pointerleave", handleLeave);
    list.addEventListener("focusin", handleEnter);
    list.addEventListener("focusout", handleLeave);

    return () => {
      list.removeEventListener("pointerover", handleEnter);
      list.removeEventListener("pointerleave", handleLeave);
      list.removeEventListener("focusin", handleEnter);
      list.removeEventListener("focusout", handleLeave);
    };
  }, []);

  const shown = visibleCount ?? partners.length;

  return (
    <div
      ref={boxRef}
      className={`relative flex w-[335px] flex-col overflow-hidden border-[0.75px] border-ink max-[599px]:w-full ${
        opaque ? "bg-cream" : "bg-cream"
      } ${collapsed || locked ? "pointer-events-none" : ""}`}
      style={{
        height: collapsed
          ? STAMP_BOX_H
          : open
            ? partnersOpenHeight(partners.length)
            : ROW_H + BOX_BORDER,
        transition: `height ${MORPH_MS}ms ${MORPH_EASE}`,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => {
            if (current) onHoverRef.current?.(null);
            return !current;
          });
        }}
        className={`flex h-10 w-full shrink-0 cursor-pointer items-center justify-center ${
          open && showHeaderLabel ? "border-b-[0.75px] border-ink" : ""
        }`}
      >
        <span
          className={`text-[12px] uppercase tracking-[0.02em] ${
            showTitle && showHeaderLabel ? "opacity-100" : "opacity-0"
          }`}
        >
          Partners
        </span>
      </button>
      <ul ref={listRef} className={`flex flex-col ${open ? "" : "hidden"}`}>
        {partners.map((partner, index) => {
          if (index >= shown) return null;
          const isActive = activeSlug === partner.slug;
          return (
            <li key={partner.slug}>
              <Link
                href={`/partners/${partner.slug}`}
                data-partner-slug={partner.slug}
                className={`relative flex h-10 items-center px-4 text-[13px] text-black ${
                  index < shown - 1 ? "border-b-[0.75px] border-ink" : ""
                } ${index < revealedCount ? "" : "pointer-events-none"}`}
                onClick={(event) => {
                  if (!onSelect) return;
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }
                  event.preventDefault();
                  onSelect(partner.slug);
                }}
              >
                <span
                  className={`uppercase ${
                    index < revealedCount ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {partner.name}
                </span>
                <span
                  className={`absolute right-4 grid size-2 place-items-center rounded-full border-[0.75px] border-black ${
                    index < revealedCount ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {isActive && (
                    <span className="size-1 rounded-full bg-black" />
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {logo && onLogoClick ? (
        <button
          type="button"
          aria-label={logo.alt}
          onClick={onLogoClick}
          className="absolute inset-0 cursor-pointer mix-blend-multiply"
          style={{ pointerEvents: "auto" }}
        >
          <StampBox src={logo.src} alt="" blend={false} seed={logo.alt} />
        </button>
      ) : logo ? (
        <StampBox src={logo.src} alt={logo.alt} seed={logo.alt} />
      ) : null}
    </div>
  );
}
