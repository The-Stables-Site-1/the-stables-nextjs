import type { Metadata } from "next";
import { site } from "@/lib/site";

export const socialImage = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "A black galloping horse on a cream background",
};

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: PageMetadata): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${site.name}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: path,
      siteName: site.name,
      title: socialTitle,
      description,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage.url],
    },
  };
}
