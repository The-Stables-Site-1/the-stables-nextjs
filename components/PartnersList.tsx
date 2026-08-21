"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Partner } from "@/lib/partners";

type PartnersListProps = {
  partners: Partner[];
  showTitle?: boolean;
  revealedCount?: number;
  opaque?: boolean;
  activeSlug?: string | null;
  onHover?: (slug: string | null) => void;
  onSelect?: (slug: string) => void;
};

export function PartnersList({
  partners,
  showTitle = true,
  revealedCount = partners.length,
  opaque = false,
  activeSlug = null,
  onHover,
  onSelect,
}: PartnersListProps) {
  const [open, setOpen] = useState(true);
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

  return (
    <div
      className={`relative flex w-[335px] flex-col border-[0.75px] border-ink ${
        opaque ? "bg-cream" : "bg-cream"
      }`}
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
        className={`flex h-10 w-full cursor-pointer items-center justify-center ${
          open ? "border-b-[0.75px] border-ink" : ""
        }`}
      >
        <span
          className={`text-[12px] uppercase tracking-[0.02em] ${
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
            <li
              key={partner.slug}
              className={
                index < partners.length - 1
                  ? "border-b-[0.75px] border-ink"
                  : ""
              }
            >
              <Link
                href={`/partners/${partner.slug}`}
                data-partner-slug={partner.slug}
                className={`relative flex h-10 items-center px-4 text-[13px] text-black ${
                  index < revealedCount ? "" : "pointer-events-none"
                }`}
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
    </div>
  );
}
