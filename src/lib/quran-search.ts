import { getSurahById, quranSurahs } from "@/src/data/quran";

export interface AyahSearchResult {
  surahId: number;
  surahSlug: string;
  surahName: string;
  surahTransliteration: string;
  surahTranslation: string;
  revelationLabel: "Meccan" | "Medinan";
  ayahId: number;
  verseText: string;
}

export interface AyahSearchResponse {
  query: string;
  results: AyahSearchResult[];
  totalResults: number;
  isTooShort: boolean;
}

const MIN_QUERY_LENGTH = 2;
const REFERENCE_QUERY_PATTERN = /^\s*(\d{1,3})\s*[:-]\s*(\d{1,3})\s*$/;

const normalizeArabicForSearch = (value: string) => {
  return value
    .normalize("NFKD")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const createSearchResult = (surahId: number, ayahId: number, verseText: string): AyahSearchResult | null => {
  const surah = getSurahById(surahId);

  if (!surah) {
    return null;
  }

  return {
    surahId: surah.id,
    surahSlug: surah.slug,
    surahName: surah.name,
    surahTransliteration: surah.transliteration,
    surahTranslation: surah.translation,
    revelationLabel: surah.revelationLabel,
    ayahId,
    verseText,
  };
};

export const searchAyahs = (rawQuery: string, limit = 80): AyahSearchResponse => {
  const query = rawQuery.trim();

  if (!query) {
    return {
      query,
      results: [],
      totalResults: 0,
      isTooShort: false,
    };
  }

  const referenceMatch = query.match(REFERENCE_QUERY_PATTERN);

  if (referenceMatch) {
    const surahId = Number(referenceMatch[1]);
    const ayahId = Number(referenceMatch[2]);
    const surah = getSurahById(surahId);
    const verse = surah?.verses.find((item) => item.id === ayahId);
    const result = verse ? createSearchResult(surahId, ayahId, verse.text) : null;

    return {
      query,
      results: result ? [result] : [],
      totalResults: result ? 1 : 0,
      isTooShort: false,
    };
  }

  const normalizedQuery = normalizeArabicForSearch(query);

  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return {
      query,
      results: [],
      totalResults: 0,
      isTooShort: true,
    };
  }

  const results: AyahSearchResult[] = [];
  let totalResults = 0;

  for (const surah of quranSurahs) {
    for (const verse of surah.verses) {
      const normalizedVerse = normalizeArabicForSearch(verse.text);

      if (!normalizedVerse.includes(normalizedQuery)) {
        continue;
      }

      totalResults += 1;

      if (results.length >= limit) {
        continue;
      }

      results.push({
        surahId: surah.id,
        surahSlug: surah.slug,
        surahName: surah.name,
        surahTransliteration: surah.transliteration,
        surahTranslation: surah.translation,
        revelationLabel: surah.revelationLabel,
        ayahId: verse.id,
        verseText: verse.text,
      });
    }
  }

  return {
    query,
    results,
    totalResults,
    isTooShort: false,
  };
};
