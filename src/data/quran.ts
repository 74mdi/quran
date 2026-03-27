import quranRaw from "@/src/data/quran.json";
import { surahTranslations } from "@/src/data/surah-translations";
import type { QuranSurah, QuranVerse, SurahMeta } from "@/src/types/quran";

interface QuranSurahRaw {
  id: number;
  name: string;
  transliteration: string;
  type: "meccan" | "medinan";
  total_verses: number;
  verses: QuranVerse[];
}

export type { QuranSurah, QuranVerse, SurahMeta };

const translationOverrides: Partial<Record<number, string>> = {
  1: "The Opening",
};

const toSlug = (transliteration: string) =>
  transliteration
    .replace(/['’`]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const normalizeSurahSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const mapTypeToLabel = (type: "meccan" | "medinan"): "Meccan" | "Medinan" => {
  return type === "meccan" ? "Meccan" : "Medinan";
};

export const quranSurahs: QuranSurah[] = (quranRaw as QuranSurahRaw[]).map((surah) => {
  return {
    id: surah.id,
    name: surah.name,
    transliteration: surah.transliteration,
    translation: translationOverrides[surah.id] ?? surahTranslations[surah.id] ?? surah.transliteration,
    slug: toSlug(surah.transliteration),
    type: surah.type,
    revelationLabel: mapTypeToLabel(surah.type),
    ayahCount: surah.total_verses,
    verses: surah.verses,
  };
});

export const surahMeta: SurahMeta[] = quranSurahs.map((surah) => ({
  id: surah.id,
  name: surah.name,
  transliteration: surah.transliteration,
  translation: surah.translation,
  slug: surah.slug,
  revelationLabel: surah.revelationLabel,
  ayahCount: surah.ayahCount,
}));

const surahById = new Map(quranSurahs.map((surah) => [surah.id, surah]));
const surahBySlug = new Map(quranSurahs.map((surah) => [normalizeSurahSlug(surah.slug), surah]));

export const getSurahById = (id: number) => {
  return surahById.get(id) ?? null;
};

export const getSurahBySlug = (slug: string) => {
  return surahBySlug.get(normalizeSurahSlug(slug)) ?? null;
};

export const getAdjacentSurahMeta = (surahId: number) => {
  const previousId = surahId === 1 ? 114 : surahId - 1;
  const nextId = surahId === 114 ? 1 : surahId + 1;

  return {
    previous: surahMeta.find((surah) => surah.id === previousId) ?? null,
    next: surahMeta.find((surah) => surah.id === nextId) ?? null,
  };
};
