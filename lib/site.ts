const p1 =
  "THE STABLES is a New York-based commercial team and operating layer for distinctive beauty, fragrance, wellness, and lifestyle brands building stronger retail distribution.";
const p2 =
  "We work in the space between taste and traction, connecting founder vision, buyer relationships, and disciplined follow-through to measurable commercial growth.";
const p3 =
  "Part sales team, part distribution partner, part retail strategy layer, part operating system, The Stables helps brands turn retail opportunity into a more focused, disciplined, and commercially useful channel.";
const p4 =
  "We sit between founder ambition, buyer expectations, wholesale operations, and the day-to-day follow-through required to make distribution perform. Our work spans retail strategy, account prioritization, wholesale sales, buyer outreach, distribution management, launch execution, reporting, reorder cadence, and the operating rhythm behind stronger specialty retail growth.";
const p5 =
  "The value is not only in opening doors. It is in helping brands make better decisions once those doors open, and keeping the work moving with the discipline required to turn opportunity into growth.";

/** Single-string lead sentence used for page metadata. */
const information = p1;

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
  /** The two-paragraph company blurb for the collapsed INFORMATION box. */
  informationBox: [p1, p2],
  /** The one-liner the intro sets word by word; only the name is capitalised. */
  introLine:
    "THE STABLES works in the space between taste and traction.",
  about: [
    {
      title: "INFORMATION",
      body: [p1, p2, p3, p4, p5],
    },
  ],
  links: {
    wholesale: "/contact",
    press: "/contact",
    instagram: "https://instagram.com/",
  },
} as const;
