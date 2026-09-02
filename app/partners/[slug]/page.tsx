import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartnerExperience } from "@/components/PartnerExperience";
import { getPartner, partners } from "@/lib/partners";
import { createPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

function partnerMetaDescription(description: string) {
  const wholesaleSuffix = " Contact The Stables for wholesale inquiries.";
  if (description.length + wholesaleSuffix.length <= 160) {
    return `${description}${wholesaleSuffix}`;
  }

  const firstSentence = description.match(/^.*?[.!?](?:\s|$)/)?.[0].trim();
  return `${firstSentence ?? description}${wholesaleSuffix}`;
}

function absoluteAssetUrl(path: string) {
  return new URL(path, site.url).toString();
}

export function generateStaticParams() {
  return partners.map((partner) => ({ slug: partner.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const partner = getPartner(slug);
  if (!partner) return { title: "Partner" };

  return createPageMetadata({
    title: `${partner.name} Wholesale & Brand Information`,
    description: partnerMetaDescription(partner.description),
    path: `/partners/${partner.slug}`,
  });
}

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const partner = getPartner(slug);
  if (!partner) notFound();

  const path = `/partners/${partner.slug}`;
  const pageUrl = `${site.url}${path}`;
  const brandId = `${pageUrl}/#brand`;
  const imageId = `${pageUrl}/#primaryimage`;
  const officialWebsite =
    partner.links.website !== "#" ? partner.links.website : undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}/#webpage`,
        url: pageUrl,
        name: `${partner.name} Wholesale & Brand Information | ${site.name}`,
        description: partner.description,
        isPartOf: {
          "@id": `${site.url}/#website`,
        },
        breadcrumb: {
          "@id": `${pageUrl}/#breadcrumb`,
        },
        primaryImageOfPage: {
          "@id": imageId,
        },
        about: { "@id": brandId },
        mainEntity: { "@id": brandId },
        inLanguage: "en-US",
      },
      {
        "@type": "Brand",
        "@id": brandId,
        name: partner.name,
        description: partner.description,
        url: pageUrl,
        logo: absoluteAssetUrl(partner.stampLogo),
        image: partner.images.map(absoluteAssetUrl),
        ...(officialWebsite ? { sameAs: [officialWebsite] } : {}),
      },
      {
        "@type": "ImageObject",
        "@id": imageId,
        contentUrl: absoluteAssetUrl(partner.images[0]),
        caption: `${partner.name} brand imagery`,
        representativeOfPage: true,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: site.name,
            item: site.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: partner.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <h1 className="sr-only">
        {partner.name} Wholesale and Brand Information
      </h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <PartnerExperience key={partner.slug} partner={partner} />
    </>
  );
}
