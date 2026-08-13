"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Partner } from "@/lib/partners";

type PartnersListProps = {
  partners: Partner[];
  showContent?: boolean;
  opaque?: boolean;
  activeSlug?: string | null;
  onHover?: (slug: string | null) => void;
};

export function PartnersList({
  partners,
  showContent = true,
  opaque = false,
  activeSlug = null,
  onHover,
}: PartnersListProps) {
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
      <div className="flex h-10 items-center justify-center border-b-[0.75px] border-ink">
        {showContent && (
          <p className="text-[12px] uppercase tracking-[0.02em]">Partners</p>
        )}
      </div>
      <ul ref={listRef} className="flex flex-col">
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
                className="relative flex h-10 items-center px-4 text-[13px] text-black"
              >
                {showContent && (
                  <>
                    <span className="uppercase">
                      {partner.name}
                    </span>
                    <span className="absolute right-4 grid size-2 place-items-center rounded-full border-[0.75px] border-black">
                      {isActive && (
                        <span className="size-1 rounded-full bg-black" />
                      )}
                    </span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
