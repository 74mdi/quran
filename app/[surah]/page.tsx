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
    return { title: "Surah Not Found" };
  }

  const title = `${currentSurah.transliteration} — ${currentSurah.name}`;
  const description = `Read Surah ${currentSurah.transliteration} (${currentSurah.translation}) — Surah ${currentSurah.id} of 114, ${currentSurah.ayahCount} Ayahs, ${currentSurah.revelationLabel}. Beautiful Arabic text with audio recitation.`;
  const ogUrl = `/api/og?surah=${currentSurah.id}`;
  const canonicalPath = `/${currentSurah.slug}`;

  return {
    title,
    description,
    openGraph: {
      title: `${currentSurah.transliteration} · ${currentSurah.name}`,
      description,
      url: canonicalPath,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `Surah ${currentSurah.transliteration} — Koko Quran`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${currentSurah.transliteration} · ${currentSurah.name}`,
      description,
      images: [ogUrl],
    },
    alternates: {
      canonical: canonicalPath,
    },
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
