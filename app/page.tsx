import type { Metadata } from "next";
import { HomeExperience } from "@/components/HomeExperience";
import { partners } from "@/lib/partners";
import { createPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: site.name,
  description: site.description,
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return (
    <>
      <h1 className="sr-only">
        The Stables — Beauty, Fragrance, Wellness, and Lifestyle Brand
        Representation
      </h1>
      <HomeExperience partners={partners} />
    </>
  );
}
