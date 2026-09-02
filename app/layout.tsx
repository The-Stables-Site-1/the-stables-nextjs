import type { Metadata, Viewport } from "next";
import { PreloadMedia } from "@/components/PreloadMedia";
import { StampClicks } from "@/components/StampClicks";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: site.name,
    title: site.name,
    description: site.description,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "A black galloping horse on a cream background",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "business",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf6e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        logo: `${site.url}/icon.png`,
        description: site.description,
        telephone: "+1-917-399-5204",
        address: {
          "@type": "PostalAddress",
          streetAddress: "161 Water Street, Suite 2205",
          addressLocality: "New York",
          addressRegion: "NY",
          postalCode: "10038",
          addressCountry: "US",
        },
        knowsAbout: [
          "B2B sales",
          "Wholesale",
          "Distribution",
          "Beauty",
          "Fragrance",
          "Wellness",
          "Lifestyle brands",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        description: site.description,
        publisher: {
          "@id": `${site.url}/#organization`,
        },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-cream font-sans text-black antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <StampClicks />
        <PreloadMedia />
        {children}
      </body>
    </html>
  );
}
