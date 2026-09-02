"use client";

import Link from "next/link";
import { useState } from "react";
import { MORPH_EASE, MORPH_MS, ROW_H } from "@/lib/morph";
import { site } from "@/lib/site";

export type ContactRow = {
  label: string;
  href: string;
  external?: boolean;
};

type ContactLinksProps = {
  revealedCount?: number;
  opaque?: boolean;
  title?: string;
  rows?: readonly ContactRow[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  collapsedHeight?: number;
  transitionMs?: number;
  transitionEase?: string;
};

const defaultRows: readonly ContactRow[] = [
  { label: "WHOLESALE", href: site.links.wholesale },
  { label: "PRESS", href: site.links.press },
  { label: "INSTAGRAM", href: site.links.instagram, external: true },
];

/** The home contact rows become these the moment a partner is chosen. */
export function partnerContactRows(links: {
  wholesale: string;
  instagram: string;
  website: string;
}): readonly ContactRow[] {
  return [
    { label: "WEBSITE", href: links.website, external: true },
    { label: "INSTAGRAM", href: links.instagram, external: true },
    { label: "WHOLESALE", href: links.wholesale },
  ];
}

export function ContactLinks({
  revealedCount,
  opaque = false,
  title = "CONTACT",
  rows = defaultRows,
  open,
  onOpenChange,
  collapsedHeight = ROW_H,
  transitionMs = MORPH_MS,
  transitionEase = MORPH_EASE,
}: ContactLinksProps) {
  const [uncontrolled, setUncontrolled] = useState(true);
  const isOpen = open ?? uncontrolled;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (open === undefined) setUncontrolled(next);
  };
  const revealed = revealedCount ?? rows.length + 1;
  const rowClass =
    "relative -mb-px flex h-[36px] w-full shrink-0 items-center border-[0.75px] border-ink bg-cream px-3 text-[12px] uppercase tracking-[0.02em] last:mb-0";

  return (
    <div
      className={`flex w-[335px] flex-col overflow-hidden max-[599px]:w-full ${
        opaque ? "bg-cream" : "bg-cream"
      }`}
      style={{
        height: isOpen
          ? ROW_H * (1 + rows.length) - rows.length
          : collapsedHeight,
        transition: `height ${transitionMs}ms ${transitionEase}`,
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
        className={`${rowClass} cursor-pointer justify-center`}
        style={{ cursor: "pointer" }}
      >
        <span className={revealed > 0 ? "opacity-100" : "opacity-0"}>
          {title}
        </span>
      </button>
      {rows.map((row, index) => {
        const className = `${rowClass} justify-start`;
        const label = (
          <span className={index + 1 < revealed ? "opacity-100" : "opacity-0"}>
            {row.label}
          </span>
        );

        if (row.external) {
          return (
            <a
              key={row.label}
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {label}
            </a>
          );
        }

        return (
          <Link key={row.label} href={row.href} className={className}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
