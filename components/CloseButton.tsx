import Link from "next/link";

export function CloseButton({
  href = "/",
  className = "fixed top-5 right-5",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`z-50 flex h-8 w-[63px] items-center justify-center border-[0.75px] border-ink-strong bg-cream p-3 text-[12px] uppercase tracking-[0.02em] text-black ${className}`}
    >
      CLOSE
    </Link>
  );
}
