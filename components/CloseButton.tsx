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
      aria-label="Close"
      className={`z-50 flex h-10 w-10 items-center justify-center border-[0.75px] border-ink bg-cream text-black ${className}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
      >
        <path
          d="M1 1L19 19M19 1L1 19"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </Link>
  );
}
