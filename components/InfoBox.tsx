"use client";

import Link from "next/link";
import { useState } from "react";
import { BOX_BORDER, MORPH_EASE, MORPH_MS, PARTNER_ROW_H, STAMP_BOX_H } from "@/lib/morph";

type InfoBoxProps = {
  title?: string;
  body?: string | readonly string[];
  moreHref?: string;
  moreLabel?: string;
  showTitle?: boolean;
  showBody?: boolean;
  opaque?: boolean;
  /** Grow with the copy instead of clipping to the stamp-module height. */
  fit?: boolean;
  /** First-line indent on paragraphs after the first; no extra vertical gap. */
  indent?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function InfoBox({
  title = "INFORMATION",
  body,
  moreHref,
  moreLabel = "Read more.",
  showTitle = true,
  showBody = true,
  opaque = false,
  fit = false,
  indent = false,
  open,
  onOpenChange,
}: InfoBoxProps) {
  const [uncontrolled, setUncontrolled] = useState(true);
  const isOpen = open ?? uncontrolled;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (open === undefined) setUncontrolled(next);
  };

  return (
    <div
      className={`relative flex w-[335px] flex-col overflow-hidden border-[0.75px] border-ink max-[599px]:w-full ${
        opaque ? "bg-cream" : "bg-cream"
      }`}
      style={{
        height: isOpen
          ? fit
            ? "auto"
            : STAMP_BOX_H
          : PARTNER_ROW_H + BOX_BORDER,
        transition: `height ${MORPH_MS}ms ${MORPH_EASE}`,
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
        className={`flex h-[32px] w-full shrink-0 cursor-pointer items-center justify-center ${
          isOpen ? "border-b-[0.75px] border-ink" : ""
        }`}
        style={{ cursor: "pointer" }}
      >
        <span
          className={`text-[11px] uppercase tracking-[0.02em] ${
            showTitle ? "opacity-100" : "opacity-0"
          }`}
        >
          {title}
        </span>
      </button>
      {body ? (
        <div
          className={`px-3 py-3 text-[12px] leading-normal [&_p]:m-0 ${
            indent ? "[&_p+p]:indent-6" : ""
          } ${showBody ? "opacity-100" : "opacity-0"}`}
        >
          {(typeof body === "string" ? [body] : body).map((paragraph, i, all) => (
            <p key={i}>
              {paragraph}
              {moreHref && i === all.length - 1 ? (
                <>
                  {" "}
                  <Link href={moreHref} className="underline underline-offset-2">
                    {moreLabel}
                  </Link>
                </>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
