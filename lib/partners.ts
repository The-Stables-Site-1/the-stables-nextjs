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
      "DEDCOOL is a genderless, vegan, non-toxic fragrance house built on making life smell really good. We translate signature scents across mediums, embedding fragrance into the products you use daily, from perfume and body wash to detergent and dryer sheets.",
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/04.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/05.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/dedcool/gallery/06.png",
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
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/04.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/05.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/06.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/facile/gallery/07.jpeg",
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
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/gallery/01.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/gallery/02.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/gallery/03.png",
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
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/hero.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/04.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/05.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/06.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/07.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/08.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/09.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/10.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/11.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/12.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/13.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/14.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/15.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/16.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/17.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/18.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/19.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/20.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/21.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/22.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/23.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/24.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/25.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/26.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/nature-of-things/gallery/27.jpeg",
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
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/02.webp",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/03.webp",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/04.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/05.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/06.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/07.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/sky-high-farm-goods/gallery/08.webp",
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
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/hero.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/03.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/04.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/05.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/06.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/07.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/08.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/tsu-lange-yor/gallery/09.png",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/",
      website: "#",
    },
  },
  {
    slug: "uniform",
    name: "Uniform",
    description:
      "UNIFORM creates considered products for daily wear and ritual, with a focus on clarity and consistency.",
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/uniform/hero.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/uniform/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/uniform/gallery/02.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/uniform/gallery/03.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/uniform/gallery/04.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/uniform/gallery/05.png",
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
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/gallery/02.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/gallery/03.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/gallery/04.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/vacation/gallery/05.png",
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
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/01.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/02.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/03.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/04.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/05.png",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/zure-solaris/gallery/06.png",
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
