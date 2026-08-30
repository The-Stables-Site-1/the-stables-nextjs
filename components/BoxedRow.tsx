import type { ReactNode } from "react";

type BoxedRowProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "button" | "a";
  href?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function BoxedRow({
  children,
  className = "",
  as = "div",
  href,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: BoxedRowProps) {
  const base =
    "relative flex h-[36px] w-full items-center border-[0.75px] border-ink bg-cream px-4 text-[12px] text-black -mb-px last:mb-0";

  if (as === "a" && href) {
    return (
      <a
        href={href}
        className={`${base} ${className}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </a>
    );
  }

  if (as === "button") {
    return (
      <button
        type="button"
        className={`${base} cursor-pointer text-left ${className}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      className={`${base} ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}
