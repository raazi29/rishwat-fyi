import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Public_Sans, Source_Serif_4 } from "next/font/google";

import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeScript } from "@/components/layout/theme-script";

import "./globals.css";

/**
 * Source Serif 4 is the record's voice — wordmark, titles, hero figures.
 * Public Sans (the USWDS civic face) carries every label, control and table.
 * JetBrains Mono is restricted to report IDs, API paths and data snippets.
 */
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-serif",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-public-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rishwat.fyi — Government, as experienced by citizens",
    template: "%s · Rishwat.fyi",
  },
  description:
    "Search official government fees and timelines in India, and compare them with what citizens actually experience. Open, anonymised, citizen-reported public data.",
  applicationName: "Rishwat.fyi",
  keywords: [
    "government transparency",
    "India",
    "official fees",
    "citizen reports",
    "open data",
    "public services",
  ],
  openGraph: {
    type: "website",
    siteName: "Rishwat.fyi",
    title: "Rishwat.fyi — Government, as experienced by citizens",
    description:
      "The gap between what a government service officially costs and what citizens actually experience, published as open public data.",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d110e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${sourceSerif.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-paper text-ink-secondary antialiased">
        <SkipLink />
        <SiteHeader />
        <main id="content" className="pb-20 lg:pb-0">
          {children}
        </main>
        <SiteFooter />
        <BottomTabBar />
      </body>
    </html>
  );
}
