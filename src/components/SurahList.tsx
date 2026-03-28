"use client";

import { Download, Play, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayerActions } from "@/src/context/PlayerContext";
import { archiveHusaryMp3Url } from "@/src/lib/archive-mp3";
import type { SurahMeta } from "@/src/types/quran";

interface SurahListProps {
  surahs: SurahMeta[];
}

interface SurahRowProps {
  surah: SurahMeta;
  onPlay: (surahId: number) => void;
}

const SurahRow = memo(({ surah, onPlay }: SurahRowProps) => {
  const rowMeta = `${surah.revelationLabel} · Surah ${surah.id} · ${surah.ayahCount} ayahs`;
  const archiveHref = archiveHusaryMp3Url(surah.id);

  return (
    <div className="group/surah border-border border-t transition-[background-color,box-shadow] duration-300 ease-out hover:bg-gray-a2/85 hover:shadow-[inset_3px_0_0_0_var(--pink-9)]">
      <div className="flex min-h-[72px] items-stretch gap-1 sm:items-center sm:justify-between">
        <button
          type="button"
          className="mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-base text-muted transition-all duration-300 ease-out group-hover/surah:scale-110 group-hover/surah:bg-pink-a3/25 group-hover/surah:text-pink-9 sm:mt-0"
          aria-label={`Play surah ${surah.transliteration}`}
          onClick={() => {
            onPlay(surah.id);
          }}
        >
          <Play size={14} className="transition-transform duration-300 group-hover/surah:drop-shadow-[0_0_8px_var(--pink-a6)]" />
        </button>

        <Link
          href={`/${surah.slug}`}
          className="min-w-0 flex-1 rounded-base py-2 pr-1 transition-all duration-300 ease-out group-hover/surah:translate-x-0.5 group-hover/surah:opacity-100"
        >
          <div className="flex min-h-[56px] flex-col justify-center gap-1 sm:min-h-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
              <span lang="ar" className="arabic-inline arabic-name shrink-0 font-arabic-title transition-colors duration-300 group-hover/surah:text-pink-11">
                {surah.name}
              </span>
              <span className="truncate font-medium transition-colors duration-300 group-hover/surah:text-foreground">{surah.transliteration}</span>
              <span className="hidden text-muted transition-colors duration-300 group-hover/surah:text-foreground/80 sm:inline">·</span>
              <span className="hidden truncate text-muted transition-colors duration-300 group-hover/surah:text-foreground/85 sm:inline">
                {surah.translation}
              </span>
            </div>

            <p className="hidden shrink-0 whitespace-nowrap text-right text-muted text-small transition-colors duration-300 group-hover/surah:text-foreground/75 sm:block">
              {rowMeta}
            </p>
            <p className="truncate text-muted text-small transition-colors duration-300 group-hover/surah:text-foreground/75 sm:hidden">{rowMeta}</p>
          </div>
        </Link>

        <a
          href={archiveHref}
          download
          rel="noopener noreferrer"
          title="Download MP3 (Al-Husary, Archive.org)"
          aria-label={`Download ${surah.transliteration} MP3`}
          className="mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-base text-muted opacity-80 transition-all duration-300 ease-out hover:bg-gray-a3 group-hover/surah:text-pink-9 group-hover/surah:opacity-100 sm:mt-0"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Download size={14} className="transition-transform duration-300 group-hover/surah:scale-110" />
        </a>
      </div>
    </div>
  );
});

SurahRow.displayName = "SurahRow";

export const SurahList = ({ surahs }: SurahListProps) => {
  const { playSurah } = usePlayerActions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryFromUrl = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(queryFromUrl);

  useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const onFocusSearch = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    window.addEventListener("koko-focus-search", onFocusSearch);

    return () => {
      window.removeEventListener("koko-focus-search", onFocusSearch);
    };
  }, []);

  const setQueryAndUrl = useCallback(
    (nextQuery: string) => {
      setQuery(nextQuery);

      const params = new URLSearchParams(searchParams.toString());

      if (nextQuery.trim()) {
        params.set("q", nextQuery.trim());
      } else {
        params.delete("q");
      }

      const nextPath = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextPath, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const filteredSurahs = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return surahs;
    }

    return surahs.filter((surah) => {
      return (
        surah.name.toLowerCase().includes(normalized) ||
        surah.transliteration.toLowerCase().includes(normalized) ||
        surah.translation.toLowerCase().includes(normalized) ||
        String(surah.id).includes(normalized)
      );
    });
  }, [query, surahs]);

  const handlePlaySurah = useCallback(
    (surahId: number) => {
      void playSurah(surahId);
    },
    [playSurah],
  );

  return (
    <div className="mt-6 flex flex-col">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" size={14} />
        <input
          ref={inputRef}
          id="surah-search-input"
          type="text"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Search surah by name, translation, or number"
          value={query}
          className="h-11 w-full rounded-base border border-border bg-background pr-11 pl-10 outline-none transition-colors placeholder:text-muted focus:border-gray-7"
          onChange={(event) => {
            setQueryAndUrl(event.target.value);
          }}
        />
        {query && (
          <button
            type="button"
            className="absolute top-1/2 right-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-base text-muted transition-colors hover:bg-gray-a2 hover:text-foreground"
            aria-label="Clear search"
            onClick={() => {
              setQueryAndUrl("");
              inputRef.current?.focus();
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <h2 className="mt-4 py-2 text-muted capitalize">Surahs ({surahs.length})</h2>

      {filteredSurahs.map((surah) => (
        <SurahRow key={surah.id} surah={surah} onPlay={handlePlaySurah} />
      ))}

      {filteredSurahs.length === 0 && <div className="border-border border-t py-8 text-center text-muted">No surahs found</div>}
    </div>
  );
};
