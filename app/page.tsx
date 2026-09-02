import type { Metadata } from "next";
import { HomeExperience } from "@/components/HomeExperience";
import { partners } from "@/lib/partners";
import { createPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title:
    "The Stables — Commercial Team and Operating Layer for Beauty, Fragrance, Wellness, and Lifestyle Brands",
  description: site.description,
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return (
    <>
      <h1 className="sr-only">
        The Stables — Commercial Team and Operating Layer for Beauty,
        Fragrance, Wellness, and Lifestyle Brands
      </h1>
      <HomeExperience partners={partners} />
    </>
  );
}
