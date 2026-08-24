"use client";

import { useState } from "react";
import { BOX_BORDER, MORPH_EASE, MORPH_MS, ROW_H, STAMP_BOX_H } from "@/lib/morph";

type InfoBoxProps = {
  title?: string;
  body?: string;
  showTitle?: boolean;
  showBody?: boolean;
  opaque?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function InfoBox({
  title = "INFORMATION",
  body,
  showTitle = true,
  showBody = true,
  opaque = false,
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
        height: isOpen ? STAMP_BOX_H : ROW_H + BOX_BORDER,
        transition: `height ${MORPH_MS}ms ${MORPH_EASE}`,
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
        className={`flex h-10 w-full shrink-0 cursor-pointer items-center justify-center ${
          isOpen ? "border-b-[0.75px] border-ink" : ""
        }`}
        style={{ cursor: "pointer" }}
      >
        <span
          className={`text-[12px] uppercase tracking-[0.02em] ${
            showTitle ? "opacity-100" : "opacity-0"
          }`}
        >
          {title}
        </span>
      </button>
      {body ? (
        <p
          className={`px-4 py-3 text-[12px] leading-normal ${
            showBody ? "opacity-100" : "opacity-0"
          }`}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}
