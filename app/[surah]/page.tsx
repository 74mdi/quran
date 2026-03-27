import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SurahReader } from "@/src/components/SurahReader";
import { getAdjacentSurahMeta, getSurahBySlug, surahMeta } from "@/src/data/quran";

interface PageProps {
  params: Promise<{ surah: string }>;
}

export async function generateStaticParams() {
  return surahMeta.map((surah) => ({
    surah: surah.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { surah } = await params;
  const currentSurah = getSurahBySlug(surah);

  if (!currentSurah) {
    return {
      title: "Surah Not Found - Koko Quran",
    };
  }

  return {
    title: `${currentSurah.transliteration} | Koko Quran`,
    description: `Read and listen to Surah ${currentSurah.transliteration} (${currentSurah.name}) with ${currentSurah.ayahCount} ayahs.`,
  };
}

export default async function SurahPage({ params }: PageProps) {
  const { surah } = await params;
  const currentSurah = getSurahBySlug(surah);

  if (!currentSurah) {
    notFound();
  }

  const { previous, next } = getAdjacentSurahMeta(currentSurah.id);

  return <SurahReader surah={currentSurah} previous={previous} next={next} />;
}
