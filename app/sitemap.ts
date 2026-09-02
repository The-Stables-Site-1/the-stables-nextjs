import type { MetadataRoute } from "next";
import { partners } from "@/lib/partners";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/about", "/contact"].map((path) => ({
    url: `${site.url}${path}`,
  }));

  const partnerPages = partners.map((partner) => ({
    url: `${site.url}/partners/${partner.slug}`,
  }));

  return [...staticPages, ...partnerPages];
}
