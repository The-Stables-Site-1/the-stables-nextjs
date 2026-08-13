import { notFound } from "next/navigation";
import { PartnerExperience } from "@/components/PartnerExperience";
import { getPartner, partners } from "@/lib/partners";

export function generateStaticParams() {
  return partners.map((partner) => ({ slug: partner.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const partner = getPartner(slug);
  if (!partner) return { title: "Partner | The Stables" };
  return {
    title: `${partner.name} | The Stables`,
    description: partner.description,
  };
}

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const partner = getPartner(slug);
  if (!partner) notFound();
  return <PartnerExperience partner={partner} />;
}
