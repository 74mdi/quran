import type { Metadata } from "next";

import { AyahSearchPage } from "@/src/components/AyahSearchPage";
import { getOgImageUrl } from "@/src/lib/og-image";
import { searchAyahs } from "@/src/lib/quran-search";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string | string[];
  }>;
}

const getQuery = async (searchParams: SearchPageProps["searchParams"]) => {
  const params = await searchParams;
  const value = params.q;

  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = await getQuery(searchParams);
  const trimmedQuery = query.trim();
  const title = trimmedQuery ? `Search Ayahs for “${trimmedQuery}”` : "Search Ayahs";
  const description = trimmedQuery
    ? `Search the Quran for “${trimmedQuery}” and jump directly to matching ayahs.`
    : "Search inside ayahs and jump directly to matching Quran verses.";

  return {
    title,
    description,
    alternates: {
      canonical: "/search",
    },
    openGraph: {
      title,
      description,
      images: [{ url: getOgImageUrl(1), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getOgImageUrl(1)],
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = await getQuery(searchParams);
  const { results, totalResults, isTooShort } = searchAyahs(query);

  return <AyahSearchPage query={query} results={results} totalResults={totalResults} isTooShort={isTooShort} />;
}
