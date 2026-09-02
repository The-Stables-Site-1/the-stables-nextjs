const BLOB =
  "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com";

const PLACEHOLDER_LOGO = `${BLOB}/partners/dedcool/logo.png`;

export type Partner = {
  slug: string;
  name: string;
  description: string;
  descriptionBlocks?: readonly string[];
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
      "DEDCOOL is a functional fragrance brand that empowers all people to smell and feel good through scent. The brand is on a mission to reshape the way fragrance is defined and experienced, built on the belief that everyone should have a signature scent that extends beyond a glass bottle. DEDCOOL brings fragrance into everyday routines through unexpected mediums — from laundry detergent, to car air fresheners, and pets — so scent becomes a practical, integrated part of daily life.",
    descriptionBlocks: [
      "DEDCOOL is a functional fragrance brand that empowers all people to smell and feel good through scent. The brand is on a mission to reshape the way fragrance is defined and experienced, built on the belief that everyone should have a signature scent that extends beyond a glass bottle.",
      "DEDCOOL brings fragrance into everyday routines through unexpected mediums — from laundry detergent, to car air fresheners, and pets — so scent becomes a practical, integrated part of daily life.",
    ],
    stampLogo: PLACEHOLDER_LOGO,
    images: [
      "/partners/dedcool/hero.jpg",
      "/partners/dedcool/gallery/01.jpg",
      "/partners/dedcool/gallery/02.jpg",
      "/partners/dedcool/gallery/04.jpg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/dedcool",
      website: "https://dedcool.com",
    },
  },
  {
    slug: "facile",
    name: "Facile",
    description:
      "FACILE is a simplified, clinically kind, dermatologist-formulated approach to happy skin. Built on the belief that good skincare should work for everyone, FACILE is made with doctor-led, proven ingredients that are non-toxic, effective, and feel-good. With intentional formulations and clinical results, achieving good skin is finally easy.",
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
      instagram: "https://instagram.com/facileskin",
      website: "https://facileskin.com",
    },
  },
  {
    slug: "nature-of-things",
    name: "Nature of Things",
    description:
      "NATURE OF THINGS sets a new standard of clean, using natural origin and plant-based ingredients to deliver high-performance results for the whole family. The brand uses the best of nature to get the best of performance, formulating with non-toxic ingredients that are gentle yet effective and chosen with long-term skin and hair health in mind. Built on a commitment to transparency, NATURE OF THINGS lets you decide what works for you. It's just the nature of things.",
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
      instagram: "https://instagram.com/natureofthings",
      website: "https://natureofthings.com",
    },
  },
  {
    slug: "sky-high-farm-goods",
    name: "Sky High Farm Goods",
    description:
      "SKY HIGH FARM GOODS is a mission-led lifestyle brand built to support the work of Sky High Farm, a nonprofit working farm that ensures everyone has access to high-quality, culturally appropriate food. Inspired by the land and those who steward it, the brand draws on deep relationships with the farmers who grow its ingredients and their generational knowledge of the land. Its formulations, scent profiles, and palettes evoke fresh produce and the earth, using regeneratively grown ingredients picked at peak potency, with the belief that beauty is nature's eternal wisdom and, in nature, every process fuels another.",
    descriptionBlocks: [
      "SKY HIGH FARM GOODS is a mission-led lifestyle brand built to support the work of Sky High Farm, a nonprofit working farm that ensures everyone has access to high-quality, culturally appropriate food. Inspired by the land and those who steward it, the brand draws on deep relationships with the farmers who grow its ingredients and their generational knowledge of the land.",
      "Its formulations, scent profiles, and palettes evoke fresh produce and the earth, using regeneratively grown ingredients picked at peak potency, with the belief that beauty is nature's eternal wisdom and, in nature, every process fuels another.",
    ],
    stampLogo: "/partners/sky-high-farm-goods/logo.png",
    images: [
      "/partners/sky-high-farm-goods/hero.jpeg",
      "/partners/sky-high-farm-goods/gallery/01.jpeg",
      "/partners/sky-high-farm-goods/gallery/02.jpeg",
      "/partners/sky-high-farm-goods/gallery/03.jpeg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/skyhighfarmgoods",
      website: "https://skyhighfarmgoods.com",
    },
  },
  {
    slug: "the-grey",
    name: "The Grey",
    description:
      "THE GREY is a men's skincare and self-care brand, founded in 2018 with the mission of giving men the confidence to take their wellness and grooming seriously. Beauty retail has rarely made room for men, with products and advice built for someone else. THE GREY was created to change that: an inclusive destination dedicated to men's skin care, beauty, and self-care, offering premium products with the no-nonsense guidance men need to choose for themselves. It's not about vanity, but about looking and feeling your best.",
    descriptionBlocks: [
      "THE GREY is a men's skincare and self-care brand, founded in 2018 with the mission of giving men the confidence to take their wellness and grooming seriously. Beauty retail has rarely made room for men, with products and advice built for someone else.",
      "THE GREY was created to change that: an inclusive destination dedicated to men's skin care, beauty, and self-care, offering premium products with the no-nonsense guidance men need to choose for themselves. It's not about vanity, but about looking and feeling your best.",
    ],
    stampLogo: "/partners/the-grey/logo.png",
    images: [
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/hero.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/gallery/01.jpeg",
      "https://hwyuivyawr7vttnf.public.blob.vercel-storage.com/partners/the-grey/gallery/02.jpeg",
    ],
    links: {
      wholesale: "/contact",
      instagram: "https://instagram.com/thegreymensskincare",
      website: "https://thegreymensskincare.com",
    },
  },
  {
    slug: "tsu-lange-yor",
    name: "Tsu Lange Yor",
    description:
      "TSU LANGE YOR is an Australian fragrance house founded by Troye Sivan. The brand's collection of fragrances and objects is designed to elevate both person and place. Deeply rooted in its home, TSU LANGE YOR develops each product in partnership with exceptional local talent and native materials, crafted to a rigorous standard of quality.",
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
      instagram: "https://instagram.com/tsulangeyor",
      website: "https://tsu-lange-yor.au",
    },
  },
  {
    slug: "vacation",
    name: "Vacation",
    description:
      "VACATION is a sun-care and lifestyle brand that takes leisure as seriously as protection. Every VACATION sunscreen is made according to the brand's proprietary \"Leisure-Enhancing\" formulation process, updating everything you love about the sunscreens of the past with the best of modern skincare science: tried-and-true ingredients with proven efficacy, formulated to guidelines set by today's leading experts, and finished with a sensorial experience designed to transport you straight to paradise. The result is \"Excessively Good\" sunscreen for those who demand the best from life.",
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
      instagram: "https://instagram.com/vacationinc",
      website: "https://vacation.inc",
    },
  },
  {
    slug: "zure-solaris",
    name: "Zure Solaris",
    description:
      "ZURE SOLARIS is the world's first sun repair brand, addressing what protection cannot: the repair and reversal of sun-induced damage. While SPF has become a daily essential, the post-sun category has remained focused on short-term rescue. ZURE SOLARIS was created to redefine that space, positioning sun repair as the essential next step in the modern skincare routine. Powered by its proprietary Solar Repair Complex, the collection restores sun-stressed skin so it can safely receive clinically active ingredients, delivering clinically validated improvements in elasticity, barrier function, and fine lines.",
    descriptionBlocks: [
      "ZURE SOLARIS is the world's first sun repair brand, addressing what protection cannot: the repair and reversal of sun-induced damage. While SPF has become a daily essential, the post-sun category has remained focused on short-term rescue.",
      "ZURE SOLARIS was created to redefine that space, positioning sun repair as the essential next step in the modern skincare routine. Powered by its proprietary Solar Repair Complex, the collection restores sun-stressed skin so it can safely receive clinically active ingredients, delivering clinically validated improvements in elasticity, barrier function, and fine lines.",
    ],
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
      instagram: "https://instagram.com/zuresolaris",
      website: "https://zuresolaris.com",
    },
  }
];

export function getPartner(slug: string): Partner | undefined {
  return partners.find((p) => p.slug === slug);
}

export const brandStampLogo = `${BLOB}/brand/stamp-logo.png`;
