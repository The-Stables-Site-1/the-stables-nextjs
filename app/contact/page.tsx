import type { Metadata } from "next";
import { ContactForm } from "@/app/contact/ContactForm";
import { createPageMetadata } from "@/lib/seo";

const description =
  "Contact The Stables in New York about wholesale, press, and commercial representation for distinctive beauty, fragrance, wellness, and lifestyle brands.";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <h1 className="sr-only">Contact The Stables</h1>
      <ContactForm />
    </>
  );
}
