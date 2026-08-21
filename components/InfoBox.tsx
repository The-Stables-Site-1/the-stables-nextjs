"use client";

import { useState } from "react";

type InfoBoxProps = {
  title?: string;
  body?: string;
  showTitle?: boolean;
  showBody?: boolean;
  opaque?: boolean;
};

export function InfoBox({
  title = "INFORMATION",
  body,
  showTitle = true,
  showBody = true,
  opaque = false,
}: InfoBoxProps) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={`relative flex w-[335px] flex-col overflow-hidden border-[0.75px] border-ink ${
        opaque ? "bg-cream" : "bg-cream"
      } ${open ? "h-[138px]" : "h-10"}`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-10 w-full shrink-0 cursor-pointer items-center justify-center ${
          open ? "border-b-[0.75px] border-ink" : ""
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
