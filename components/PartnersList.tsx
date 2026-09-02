"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BOX_BORDER,
  MORPH_EASE,
  MORPH_MS,
  PARTNER_ROW_H,
  partnersOpenHeight,
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
  /** Override the collapsed geometry for a route-to-route handoff. */
  collapsedHeight?: number;
  transitionMs?: number;
  transitionEase?: string;
  locked?: boolean;
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
  collapsedHeight = STAMP_BOX_H,
  transitionMs = MORPH_MS,
  transitionEase = MORPH_EASE,
  locked = false,
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

    const handleFocusLeave = (event: Event) => {
      const related = (event as MouseEvent).relatedTarget as Node | null;
      if (related && list.contains(related)) return;
      onHoverRef.current?.(null);
    };

    list.addEventListener("pointerover", handleEnter);
    list.addEventListener("focusin", handleEnter);
    list.addEventListener("focusout", handleFocusLeave);

    return () => {
      list.removeEventListener("pointerover", handleEnter);
      list.removeEventListener("focusin", handleEnter);
      list.removeEventListener("focusout", handleFocusLeave);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className={`relative flex w-[335px] flex-col overflow-hidden border-[0.75px] border-ink max-[599px]:w-full ${
        opaque ? "bg-cream" : "bg-cream"
      } ${collapsed || locked ? "pointer-events-none" : ""}`}
      style={{
        height: collapsed
          ? collapsedHeight
          : open
            ? partnersOpenHeight(partners.length)
            : PARTNER_ROW_H + BOX_BORDER,
        transition: `height ${transitionMs}ms ${transitionEase}`,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className={`flex h-[32px] w-full shrink-0 cursor-pointer items-center justify-center ${
          open ? "border-b-[0.75px] border-ink" : ""
        }`}
      >
        <span
          className={`text-[11px] uppercase tracking-[0.02em] ${
            showTitle ? "opacity-100" : "opacity-0"
          }`}
        >
          Partners
        </span>
      </button>
      <ul ref={listRef} className={`flex flex-col ${open ? "" : "hidden"}`}>
        {partners.map((partner, index) => {
          const isActive = activeSlug === partner.slug;
          return (
            <li key={partner.slug}>
              <Link
                href={`/partners/${partner.slug}`}
                data-partner-slug={partner.slug}
                className={`relative flex h-[32px] items-center px-3 text-[11px] text-black ${
                  index < partners.length - 1
                    ? "border-b-[0.75px] border-ink"
                    : ""
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
                  className={`uppercase tracking-[0.04em] ${
                    index < revealedCount ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {partner.name}
                </span>
                <span
                  className={`absolute right-3 grid size-2 place-items-center rounded-full border-[0.75px] border-black ${
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
    </div>
  );
}
