"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";

type ContactLinksProps = {
  revealedCount?: number;
  opaque?: boolean;
};

const rows = [
  { label: "WHOLESALE", href: site.links.wholesale },
  { label: "PRESS", href: site.links.press },
  { label: "INSTAGRAM", href: site.links.instagram, external: true },
] as const;

export function ContactLinks({
  revealedCount = rows.length + 1,
  opaque = false,
}: ContactLinksProps) {
  const [open, setOpen] = useState(true);
  const rowClass =
    "relative -mb-px flex h-10 w-full items-center border-[0.75px] border-ink bg-cream px-4 text-[12px] uppercase tracking-[0.02em] last:mb-0";

  return (
    <div
      className={`flex w-[335px] flex-col ${opaque ? "bg-cream" : "bg-cream"}`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${rowClass} cursor-pointer justify-center`}
        style={{ cursor: "pointer" }}
      >
        <span className={revealedCount > 0 ? "opacity-100" : "opacity-0"}>
          CONTACT
        </span>
      </button>
      {rows.map((row, index) => {
        const className = `${rowClass} justify-start ${open ? "" : "hidden"}`;
        const label = (
          <span
            className={index + 1 < revealedCount ? "opacity-100" : "opacity-0"}
          >
            {row.label}
          </span>
        );

        if ("external" in row && row.external) {
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
