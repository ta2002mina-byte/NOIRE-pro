import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";

import "./globals.css";
import { SITE_URL } from "@/lib/env";

const fontDisplay = Bodoni_Moda({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const fontSans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const DESCRIPTION = "Your table. Your taste. Your story.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "NOIRÉ",
  title: { default: "NOIRÉ", template: "%s — NOIRÉ" },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "NOIRÉ",
    title: "NOIRÉ",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "NOIRÉ",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0B0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
