const information =
  "THE STABLES is a high-touch commercial team for distinctive beauty, fragrance, wellness, and lifestyle brands. From New York, we lead B2B sales, wholesale, and distribution as an extension of each brand.";

export const site = {
  name: "THE STABLES",
  addressLines: [
    "WSA 161 WATER STREET #2205",
    "NEW YORK, NY 10038",
  ],
  phone: "917.399.5204",
  website: "THESTABLES.COM",
  websiteUrl: "https://thestables.world",
  information,
  /** The one-liner the intro sets word by word; only the name is capitalised. */
  introLine:
    "THE STABLES works in the space between taste and traction.",
  about: [
    {
      title: "INFORMATION",
      body: [
        information,
        "We sit with founders on assortment, doors, and the season-to-season work of keeping a house present in the rooms that matter. The desk is small on purpose: one team that can sell, follow through, and stay close to the product, so every account feels staffed from inside the brand.",
      ],
    },
  ],
  links: {
    wholesale: "/contact",
    press: "/contact",
    instagram: "https://instagram.com/",
  },
} as const;
