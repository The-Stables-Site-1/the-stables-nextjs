import { brandStampLogo, partners } from "@/lib/partners";

/** Small stamp dies only — not the partner photo galleries. */
export function stampLogoUrls(): string[] {
  const urls = new Set<string>([brandStampLogo, "/stamp-logo.png"]);
  for (const partner of partners) {
    if (partner.stampLogo) urls.add(partner.stampLogo);
  }
  return [...urls];
}

export const STAMP_LOGO_URLS = stampLogoUrls();
