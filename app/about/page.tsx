import { AboutExperience } from "@/components/AboutExperience";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "Learn how The Stables supports distinctive beauty, fragrance, wellness, and lifestyle brands with B2B sales, wholesale, and distribution.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <h1 className="sr-only">About The Stables</h1>
      <AboutExperience />
    </>
  );
}
