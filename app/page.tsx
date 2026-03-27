import type { Metadata } from "next";
import { Suspense } from "react";
import { SurahList } from "@/src/components/SurahList";
import { surahMeta } from "@/src/data/quran";

export const metadata: Metadata = {
  title: {
    absolute: "Koko Quran — Read the Holy Quran",
  },
  description: "Read the Holy Quran online — all 114 Surahs in beautiful Arabic. Listen to recitation by Mahmoud Khalil Al-Husary.",
  openGraph: {
    images: [{ url: "/api/og?surah=1", width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="mt-6 text-muted">Loading surahs...</p>}>
      <SurahList surahs={surahMeta} />
    </Suspense>
  );
}
