const BLOB =
  "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com";

const PLACEHOLDER_LOGO = `${BLOB}/partners/dedcool/logo.png`;

export type Partner = {
  slug: string;
  name: string;
  description: string;
  stampLogo: string;
  images: string[];
  links: {
    wholesale: string;
    instagram: string;
    website: string;
  };
};

export const partners: Partner[] = [
  {
    slug: "dedcool",
    name: "DedCool",
    description:
      "DedCool is a functional fragrance brand that empowers all people to smell and feel good through scent. The brand is on a mission to reshape the way fragrance is defined and experienced, built on the belief that everyone should have a signature scent that extends beyond a glass bottle. DedCool brings fragrance into everyday routines through unexpected mediums — from laundry detergent, to car air fresheners, and pets — so scent becomes a practical, integrated part of daily life.",
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "/partners/dedcool/hero.jpg",
      "/partners/dedcool/gallery/01.jpg",
      "/partners/dedcool/gallery/02.jpg",
      "/partners/dedcool/gallery/04.jpg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/",
      website: "https://dedcool.com",
    },
  },
  {
    slug: "facile",
    name: "Facile",
    description:
      "Facile is a simplified, clinically kind, dermatologist-formulated approach to happy skin. Built on the belief that good skincare should work for everyone, Facile is made with doctor-led, proven ingredients that are non-toxic, effective, and feel-good. With intentional formulations and clinical results, achieving good skin is finally easy.",
    stampLogo: "/partners/facile/logo.png",
    images: [
      "/partners/facile/hero.jpg",
      "/partners/facile/gallery/01.jpg",
      "/partners/facile/gallery/02.jpg",
      "/partners/facile/gallery/03.jpg",
      "/partners/facile/gallery/04.jpg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/",
      website: "#",
    },
  },
  {
    slug: "nature-of-things",
    name: "Nature of Things",
    description:
      "Nature of Things sets a new standard of clean, using natural origin and plant-based ingredients to deliver high-performance results for the whole family. The brand uses the best of nature to get the best of performance, formulating with non-toxic ingredients that are gentle yet effective and chosen with long-term skin and hair health in mind. Built on a commitment to transparency, Nature of Things lets you decide what works for you. It's just the nature of things.",
    stampLogo: "/partners/nature-of-things/logo.png",
    images: [
      "/partners/nature-of-things/hero.jpeg",
      "/partners/nature-of-things/gallery/01.jpeg",
      "/partners/nature-of-things/gallery/02.jpeg",
      "/partners/nature-of-things/gallery/03.jpeg",
      "/partners/nature-of-things/gallery/04.jpeg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/",
      website: "#",
    },
  },
  {
    slug: "sky-high-farm-goods",
    name: "Sky High Farm Goods",
    description:
      "Sky High Farm Goods is a mission-led lifestyle brand built to support the work of Sky High Farm, a nonprofit working farm that ensures everyone has access to high-quality, culturally appropriate food. Inspired by the land and those who steward it, the brand draws on deep relationships with the farmers who grow its ingredients and their generational knowledge of the land. Its formulations, scent profiles, and palettes evoke fresh produce and the earth, using regeneratively grown ingredients picked at peak potency, with the belief that beauty is nature's eternal wisdom and, in nature, every process fuels another.",
    stampLogo: "/partners/sky-high-farm-goods/logo.png",
    images: [
      "/partners/sky-high-farm-goods/hero.jpeg",
      "/partners/sky-high-farm-goods/gallery/01.jpeg",
      "/partners/sky-high-farm-goods/gallery/02.jpeg",
      "/partners/sky-high-farm-goods/gallery/03.jpeg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/",
      website: "#",
    },
  },
  {
    slug: "the-grey",
    name: "The Grey",
    description:
      "The Grey is a men's skincare brand built for the modern, active man, developed alongside leading European laboratories and formulated around what men's skin actually needs. The line pairs targeted topical care with an inside-out philosophy, anchored by a daily vitamin and mineral system designed to support skin and counter the wear of a stressful, active life from within. It's a compact, well-designed regimen built on the idea that real skincare works on both fronts — what you put on, and what you take in.",
    stampLogo: "/partners/the-grey/logo.png",
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/gallery/02.jpeg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/",
      website: "#",
    },
  },
  {
    slug: "tsu-lange-yor",
    name: "Tsu Lange Yor",
    description:
      "Tsu Lange Yor is an independent fragrance and lifestyle brand founded by brothers Troye Sivan and Steele Mellet in Carlton, Australia. Its name comes from a Yiddish phrase meaning 'to long years and to good years,' and its scents for home and body are built around identity, sanctuary, and heritage. Each fragrance is developed with a rotating cast of perfumers and visual artists, giving the collection a distinct personality per scent rather than a single house signature.",
    stampLogo: "/partners/tsu-lange-yor/logo.png",
    images: [
      "/partners/tsu-lange-yor/hero.jpeg",
      "/partners/tsu-lange-yor/gallery/01.jpeg",
      "/partners/tsu-lange-yor/gallery/02.jpeg",
      "/partners/tsu-lange-yor/gallery/03.jpeg",
      "/partners/tsu-lange-yor/gallery/04.jpeg",
      "/partners/tsu-lange-yor/gallery/05.jpeg",
      "/partners/tsu-lange-yor/gallery/06.jpeg",
      "/partners/tsu-lange-yor/gallery/07.jpeg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/",
      website: "#",
    },
  },
  {
    slug: "vacation",
    name: "Vacation",
    description:
      "Vacation makes sunscreen and body care built around a single idea: summer should smell like summer. Its signature scent — coconut, banana, pineapple, and orange blossom laid over pool water, pool toy, and swimsuit fabric — was developed with perfumer Carlos Huber of Arquiste and Rodrigo Flores-Roux of Givaudan to bottle the exact nostalgia of an '80s poolside afternoon. Marketed as the world's best-smelling sunscreen, Vacation treats sun care as a scent-first, high-performance lifestyle product.",
    stampLogo: "/partners/vacation/logo.png",
    images: [
      "/partners/vacation/hero.jpg",
      "/partners/vacation/gallery/01.jpg",
      "/partners/vacation/gallery/02.jpg",
      "/partners/vacation/gallery/03.jpg",
      "/partners/vacation/gallery/04.jpg",
      "/partners/vacation/gallery/05.jpeg",
      "/partners/vacation/gallery/06.jpg",
      "/partners/vacation/gallery/07.jpg",
      "/partners/vacation/gallery/08.jpg",
      "/partners/vacation/gallery/09.jpeg",
      "/partners/vacation/gallery/10.jpg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/",
      website: "#",
    },
  },
  {
    slug: "zure-solaris",
    name: "Zure Solaris",
    description:
      "Zure Solaris is a London-based after-sun and everyday skincare brand founded by creative director Samuel Cheney and photographer Aaron Hurley. Its formulas are built around the brand's Solar Repair Complex, developed to counteract both the immediate and long-term effects of sun exposure on skin. The four-product routine — a shower rinse, body treatment, cooling infusion, and essential serum — is finished with a signature scent of calamansi, violet leaf, ginger, amber, and woods, treating recovery from the sun as its own ritual rather than an afterthought.",
    stampLogo: "/partners/zure-solaris/logo.png",
    images: [
      "/partners/zure-solaris/hero.png",
      "/partners/zure-solaris/gallery/01.png",
      "/partners/zure-solaris/gallery/02.png",
      "/partners/zure-solaris/gallery/04.png",
      "/partners/zure-solaris/gallery/03.png",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/",
      website: "#",
    },
  }
];

export function getPartner(slug: string): Partner | undefined {
  return partners.find((p) => p.slug === slug);
}

export const brandStampLogo = `${BLOB}/brand/stamp-logo.png`;
