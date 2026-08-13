import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Stables",
  description:
    "THE STABLES is a high-touch external commercial team for distinctive beauty, fragrance, wellness, and lifestyle brands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-cream font-sans text-black antialiased">
        {children}
      </body>
    </html>
  );
}
