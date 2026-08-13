import Link from "next/link";
import { site } from "@/lib/site";

type ContactLinksProps = {
  showContent?: boolean;
  opaque?: boolean;
};

const rows = [
  { label: "CONTACT", href: "/contact", centered: true },
  { label: "WHOLESALE", href: site.links.wholesale, centered: false },
  { label: "PRESS", href: site.links.press, centered: false },
  { label: "INSTAGRAM", href: site.links.instagram, centered: false, external: true },
] as const;

export function ContactLinks({
  showContent = true,
  opaque = false,
}: ContactLinksProps) {
  return (
    <div
      className={`flex w-[335px] flex-col ${opaque ? "bg-cream" : "bg-cream"}`}
    >
      {rows.map((row) => {
        const className = `relative -mb-px flex h-10 w-full items-center border-[0.75px] border-ink bg-cream px-4 text-[12px] uppercase tracking-[0.02em] last:mb-0 ${
          row.centered ? "justify-center" : "justify-start"
        }`;

        const content = showContent ? row.label : null;

        if ("external" in row && row.external) {
          return (
            <a
              key={row.label}
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {content}
            </a>
          );
        }

        return (
          <Link key={row.label} href={row.href} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
