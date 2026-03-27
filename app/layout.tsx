import "@/styles/main.css";

import clsx from "clsx";
import type { Metadata, Viewport } from "next";
import { Amiri, Inter, Scheherazade_New } from "next/font/google";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { BottomPlayer } from "@/src/components/BottomPlayer";
import { GlobalSearchShortcut } from "@/src/components/GlobalSearchShortcut";
import { PageTransition } from "@/src/components/PageTransition";
import { surahMeta } from "@/src/data/quran";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://koko-quran.vercel.app"),
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
    images: [{ url: "/api/og?surah=1", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koko Quran — Read the Holy Quran",
    description: "Read the Holy Quran online — all 114 Surahs in beautiful Arabic.",
    images: ["/api/og?surah=1"],
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
    <html lang="en" className={clsx(inter.className, amiri.variable, scheherazade.variable)} suppressHydrationWarning>
      <body>
        <Providers surahs={surahMeta}>
          <GlobalSearchShortcut />

          <main className="mx-auto max-w-screen-sm overflow-x-hidden px-6 py-24 md:overflow-x-visible">
            <article className="article">
              <header className="mb-4 flex w-full items-center text-small">
                <Link href="/" className="text-muted">
                  Home
                </Link>
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
  );
}
