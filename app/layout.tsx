import "@/styles/main.css";

import clsx from "clsx";
import type { Metadata, Viewport } from "next";
import { Amiri, Inter, Scheherazade_New } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { SiteTitle } from "@/components/SiteTitle";
import { BottomPlayer } from "@/src/components/BottomPlayer";
import { GlobalSearchShortcut } from "@/src/components/GlobalSearchShortcut";
import { PageTransition } from "@/src/components/PageTransition";
import { surahMeta } from "@/src/data/quran";
import { getOgImageUrl } from "@/src/lib/og-image";
import { siteUrl } from "@/src/lib/site-url";

const defaultOgImage = getOgImageUrl(1);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Koko Quran",
    template: "%s — Koko Quran",
  },
  description: "Read the Holy Quran online — all 114 Surahs in beautiful Arabic with audio recitation by Mahmoud Khalil Al-Husary.",
  keywords: ["Quran", "القرآن", "Quran online", "read Quran", "Al-Husary", "Islamic", "Surah"],
  authors: [{ name: "Koko Quran" }],
  creator: "Koko Quran",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Koko Quran",
    title: "Koko Quran — Read the Holy Quran",
    description: "Read the Holy Quran online — all 114 Surahs in beautiful Arabic.",
    images: [{ url: defaultOgImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koko Quran — Read the Holy Quran",
    description: "Read the Holy Quran online — all 114 Surahs in beautiful Arabic.",
    images: [defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const scheherazade = Scheherazade_New({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-scheherazade-new",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en" className={clsx(inter.className, amiri.variable, scheherazade.variable)} suppressHydrationWarning>
        <body>
          <Providers surahs={surahMeta}>
            <GlobalSearchShortcut />

            <main id="page-top" className="mx-auto max-w-screen-sm overflow-x-hidden px-6 py-24 md:overflow-x-visible">
              <article className="article">
                <header className="mb-5 flex w-full items-center border-border border-b pb-3">
                  <SiteTitle className="text-[clamp(2.25rem,9vw,3.4rem)] tracking-[-0.045em]" />
                </header>

                <PageTransition>{children}</PageTransition>

                <div className="mt-16">
                  <Footer />
                </div>
              </article>
            </main>

            <BottomPlayer />
          </Providers>
        </body>
      </html>
    </ViewTransitions>
  );
}
