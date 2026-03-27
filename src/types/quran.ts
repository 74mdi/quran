export interface QuranVerse {
  id: number;
  text: string;
}

export interface QuranSurah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  slug: string;
  type: "meccan" | "medinan";
  revelationLabel: "Meccan" | "Medinan";
  ayahCount: number;
  verses: QuranVerse[];
}

export interface SurahMeta {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  slug: string;
  revelationLabel: "Meccan" | "Medinan";
  ayahCount: number;
}
