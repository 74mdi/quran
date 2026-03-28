import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { surahTranslations } from "@/src/data/surah-translations";
import type { SurahMeta } from "@/src/types/quran";

export const runtime = "nodejs";

interface QuranSurahRaw {
  id: number;
  name: string;
  transliteration: string;
  type: "meccan" | "medinan";
  total_verses: number;
}

const translationOverrides: Partial<Record<number, string>> = {
  1: "The Opening",
};

const toSlug = (transliteration: string) =>
  transliteration
    .replace(/['’`]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeSurahSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const mapTypeToLabel = (type: "meccan" | "medinan"): "Meccan" | "Medinan" => {
  return type === "meccan" ? "Meccan" : "Medinan";
};

const toArrayBuffer = (buffer: Buffer) => {
  return Uint8Array.from(buffer).buffer;
};

const interBoldPromise = readFile(new URL("../../../public/assets/inter/semi-bold.ttf", import.meta.url))
  .then(toArrayBuffer)
  .catch(() => null);

const getSurahMeta = (() => {
  let surahMetaPromise: Promise<SurahMeta[]> | null = null;

  return () => {
    surahMetaPromise ??= readFile(new URL("../../../src/data/quran.json", import.meta.url), "utf8").then((raw) => {
      const surahs = JSON.parse(raw) as QuranSurahRaw[];

      return surahs.map((surah) => ({
        id: surah.id,
        name: surah.name,
        transliteration: surah.transliteration,
        translation: translationOverrides[surah.id] ?? surahTranslations[surah.id] ?? surah.transliteration,
        slug: toSlug(surah.transliteration),
        revelationLabel: mapTypeToLabel(surah.type),
        ayahCount: surah.total_verses,
      }));
    });

    return surahMetaPromise;
  };
})();

const getSurahForQuery = (surahs: SurahMeta[], raw: string) => {
  return (
    surahs.find((surah) => String(surah.id) === raw) ||
    surahs.find((surah) => surah.transliteration.toLowerCase() === raw.toLowerCase()) ||
    surahs.find(
      (surah) => normalizeSurahSlug(surah.slug) === normalizeSurahSlug(raw) || normalizeSurahSlug(surah.transliteration) === normalizeSurahSlug(raw),
    ) ||
    surahs[0]
  );
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const surahParam = searchParams.get("surah");
  const nameParam = searchParams.get("name");
  const raw = surahParam ?? nameParam ?? "1";
  const [surahMeta, interBold] = await Promise.all([getSurahMeta(), interBoldPromise]);

  const surah = getSurahForQuery(surahMeta, raw);

  const amiriBold = await fetch("https://fonts.gstatic.com/s/amiri/v30/J7acnpd8CGxBHp2VkZY4.ttf")
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("amiri"))))
    .catch(() => null);

  const fonts: {
    name: string;
    data: ArrayBuffer;
    weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    style?: "normal" | "italic";
  }[] = [];

  if (interBold) {
    fonts.push({ name: "Inter", data: interBold, weight: 700 });
  }

  if (amiriBold) {
    fonts.push({ name: "Amiri", data: amiriBold, weight: 700 });
  }

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        backgroundColor: "#0a0a0a",
        padding: "72px 80px",
        fontFamily: "Inter, sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 60%)",
          display: "flex",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span
          style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Koko Quran
        </span>
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "15px" }}>·</span>
        <span
          style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.08em",
          }}
        >
          Surah {surah.id} of 114
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            fontSize: "96px",
            color: "rgba(255,255,255,0.9)",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            fontFamily: amiriBold ? "Amiri, serif" : "Inter, sans-serif",
            direction: "rtl",
          }}
        >
          {surah.name}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span
            style={{
              fontSize: "28px",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
            }}
          >
            {surah.transliteration}
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "24px" }}>·</span>
          <span
            style={{
              fontSize: "22px",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 400,
            }}
          >
            {surah.translation}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div
          style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.5)",
            backgroundColor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "6px 14px",
            letterSpacing: "0.06em",
          }}
        >
          {surah.revelationLabel}
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.5)",
            backgroundColor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "6px 14px",
          }}
        >
          {surah.ayahCount} Ayahs
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts,
    },
  );
}
