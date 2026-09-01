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
      "DEDCOOL is a genderless, vegan, non-toxic fragrance house built on making life smell good. We translate signature scents, embedding fragrance in daily products from perfume to detergent and dryer sheets.",
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/04.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/05.jpeg",
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
      "FACILE creates refined skincare and body care with a focus on everyday ritual and elevated essentials.",
    stampLogo: "/partners/facile/logo.png",
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/04.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/05.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/06.jpeg",
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
      "NATURE OF THINGS crafts plant-forward wellness products rooted in botanical intelligence and sensory design.",
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
      "SKY HIGH FARM GOODS brings farm-driven goods and regenerative agriculture into everyday beauty and lifestyle.",
    stampLogo: "/partners/sky-high-farm-goods/logo.png",
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/04.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/05.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/06.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/07.jpeg",
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
      "THE GREY is a distinctive lifestyle and wellness brand built around quiet luxury and intentional living.",
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
      "TSU LANGE YOR is a distinctive fragrance and lifestyle brand with a singular aesthetic voice.",
    stampLogo: "/partners/tsu-lange-yor/logo.png",
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/04.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/05.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/06.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/07.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/08.jpeg",
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
      "VACATION is a sun-care and lifestyle brand built around leisure, nostalgia, and high-performance formulas.",
    stampLogo: "/partners/vacation/logo.png",
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/gallery/04.jpeg",
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
      "ZURE SOLARIS explores light, scent, and ritual through distinctive beauty and wellness products.",
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/04.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/05.jpeg",
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
