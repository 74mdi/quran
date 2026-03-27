import "@/styles/main.css";

import clsx from "clsx";
import type { Metadata, Viewport } from "next";
import { Amiri, Inter, Scheherazade_New } from "next/font/google";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { OpenGraph } from "@/lib/og";
import { BottomPlayer } from "@/src/components/BottomPlayer";
import { GlobalSearchShortcut } from "@/src/components/GlobalSearchShortcut";
import { PageTransition } from "@/src/components/PageTransition";
import { surahMeta } from "@/src/data/quran";

export const metadata: Metadata = {
  ...OpenGraph,
  title: "Koko Quran",
  description: "Read and listen to the Holy Quran — all 114 Surahs in beautiful Arabic",
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

          <main className="mx-auto max-w-screen-sm overflow-x-hidden px-6 py-24 pb-48 md:overflow-x-visible">
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
