import type { Metadata } from "next";
import { PreloadMedia } from "@/components/PreloadMedia";
import { StampClicks } from "@/components/StampClicks";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Stables",
  description:
    "THE STABLES is a New York-based external commercial team and operating layer for premium beauty, fragrance, wellness, and lifestyle brands building stronger retail distribution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-cream font-sans text-black antialiased">
        <StampClicks />
        <PreloadMedia />
        {children}
      </body>
    </html>
  );
}
