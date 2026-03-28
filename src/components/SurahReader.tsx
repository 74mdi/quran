"use client";

import { Copy, Download, Highlighter, Play } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { VerseBlock } from "@/src/components/VerseBlock";
import { usePlayerActions, usePlayerState, usePlayerTiming } from "@/src/context/PlayerContext";
import { archiveHusaryMp3Url } from "@/src/lib/archive-mp3";
import { bismillah } from "@/src/lib/quran-format";
import type { QuranSurah, SurahMeta } from "@/src/types/quran";

interface SurahReaderProps {
  surah: QuranSurah;
  previous: SurahMeta | null;
  next: SurahMeta | null;
}

const separator = <span>⋅</span>;

export const SurahReader = ({ surah, previous, next }: SurahReaderProps) => {
  const { playSurah, toggleHighlightAyah } = usePlayerActions();
  const { currentSurahId, highlightAyah } = usePlayerState();
  const { currentAyah, isPlaying } = usePlayerTiming();

  const [copied, setCopied] = useState(false);
  const lastScrolledAyahRef = useRef<number | null>(null);
  const scrollDebounceRef = useRef<number | null>(null);

  const goToAyah = useCallback((ayahNumber: number) => {
    const target = document.getElementById(`ayah-${ayahNumber}`);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  useEffect(() => {
    if (!highlightAyah || currentSurahId !== surah.id || !currentAyah || !isPlaying) {
      return;
    }

    if (lastScrolledAyahRef.current === currentAyah) {
      return;
    }

    if (scrollDebounceRef.current) {
      window.clearTimeout(scrollDebounceRef.current);
    }

    scrollDebounceRef.current = window.setTimeout(() => {
      lastScrolledAyahRef.current = currentAyah;
      goToAyah(currentAyah);
    }, 140);

    return () => {
      if (scrollDebounceRef.current) {
        window.clearTimeout(scrollDebounceRef.current);
        scrollDebounceRef.current = null;
      }
    };
  }, [currentAyah, currentSurahId, goToAyah, highlightAyah, isPlaying, surah.id]);

  const playCurrentSurah = useCallback(() => {
    void playSurah(surah.id);
  }, [playSurah, surah.id]);

  const archiveHref = archiveHusaryMp3Url(surah.id);

  const copyArabicText = async () => {
    const fullArabic = [surah.id === 9 ? null : bismillah, ...surah.verses.map((verse) => verse.text)].filter(Boolean).join("\n\n");

    await navigator.clipboard.writeText(fullArabic);

    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div>
      <div className="flex flex-col">
        <div className="mt-1 flex flex-wrap items-center gap-2 text-muted text-small">
          <span>Revealed in {surah.revelationLabel}</span>
          {separator}
          <span>Surah {surah.id} of 114</span>
          {separator}
          <span>{surah.ayahCount} Ayahs</span>
        </div>

        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 leading-tight sm:gap-4">
          <span className="min-w-0 truncate text-left font-medium text-xl sm:text-2xl">{surah.transliteration}</span>
          <span className="px-1 text-center text-muted text-small sm:text-default">{surah.translation}</span>
          <span lang="ar" className="arabic-heading justify-self-end text-right font-arabic-title text-xl sm:text-2xl">
            {surah.name}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-small">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-1.5 rounded-base border border-border px-3 transition-colors hover:bg-gray-a2"
            onClick={playCurrentSurah}
          >
            <Play size={14} />
            <span>Play</span>
          </button>

          <a
            href={archiveHref}
            download
            rel="noopener noreferrer"
            title="Download MP3 (Al-Husary, Archive.org)"
            className="inline-flex h-11 items-center gap-1.5 rounded-base border border-border px-3 transition-colors hover:bg-gray-a2"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </a>

          <button
            type="button"
            className="inline-flex h-11 items-center gap-1.5 rounded-base border border-border px-3 transition-colors hover:bg-gray-a2"
            onClick={() => {
              void copyArabicText();
            }}
          >
            <Copy size={14} />
            <span>Copy</span>
          </button>

          <button
            type="button"
            className={`inline-flex h-11 items-center gap-1.5 rounded-base border border-border px-3 transition-colors hover:bg-gray-a2 ${
              highlightAyah ? "text-pink-9" : "text-muted"
            }`}
            title={highlightAyah ? "Disable verse highlighting" : "Enable verse highlighting"}
            onClick={toggleHighlightAyah}
          >
            <Highlighter size={14} />
            <span>Highlight</span>
          </button>
        </div>
      </div>

      {copied && <div className="fixed right-6 bottom-28 z-50 rounded-base border border-border bg-background px-3 py-2 text-small">Copied!</div>}

      <div className="mt-6">
        {surah.id !== 9 && (
          <div className="border-border border-t py-8 text-center">
            <p lang="ar" className="arabic-inline arabic-verse font-arabic-body">
              {bismillah}
            </p>
          </div>
        )}

        {surah.verses.map((verse) => {
          const isActive = highlightAyah && currentSurahId === surah.id && currentAyah === verse.id;

          return <VerseBlock key={verse.id} verse={verse} isActive={isActive} />;
        })}
      </div>

      <div className="mt-16 flex w-full justify-between border-border border-t pt-8">
        {previous && (
          <Link href={`/${previous.slug}`} className="flex w-full flex-col gap-1 text-left">
            <span className="text-muted">Previous</span>
            <span>{previous.transliteration}</span>
          </Link>
        )}
        {next && (
          <Link href={`/${next.slug}`} className="flex w-full flex-col gap-1 text-right">
            <span className="text-muted">Next</span>
            <span>{next.transliteration}</span>
          </Link>
        )}
      </div>
    </div>
  );
};
