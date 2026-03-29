"use client";

import { ArrowRight, LoaderCircle, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Link, useTransitionRouter } from "next-view-transitions";
import { startTransition, useDeferredValue, useEffect, useEffectEvent, useRef, useState } from "react";
import { toArabicNumber } from "@/src/lib/quran-format";
import type { AyahSearchResult } from "@/src/lib/quran-search";

interface AyahSearchPageProps {
  query: string;
  results: AyahSearchResult[];
  totalResults: number;
  isTooShort: boolean;
}

const quickSearches = ["الرحمن", "الصبر", "موسى", "2:255"];

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const highlightVerse = (text: string, query: string) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return text;
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, "giu");
  const parts = text.split(pattern);

  if (parts.length === 1) {
    return text;
  }

  let offset = 0;

  return parts.map((part) => {
    const key = `${offset}-${part}`;
    offset += part.length;

    if (part.toLocaleLowerCase() === trimmedQuery.toLocaleLowerCase()) {
      return (
        <mark key={key} className="rounded-[6px] bg-pink-a3 px-1 text-foreground">
          {part}
        </mark>
      );
    }

    return <span key={key}>{part}</span>;
  });
};

const resultSummary = (resultsCount: number, totalResults: number) => {
  if (totalResults <= 0) {
    return "No ayahs found";
  }

  if (resultsCount === totalResults) {
    return `${totalResults} ayah${totalResults === 1 ? "" : "s"} found`;
  }

  return `Showing ${resultsCount} of ${totalResults} ayahs`;
};

export const AyahSearchPage = ({ query, results, totalResults, isTooShort }: AyahSearchPageProps) => {
  const pathname = usePathname();
  const router = useTransitionRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draftQuery, setDraftQuery] = useState(query);
  const [isRouting, setIsRouting] = useState(false);
  const deferredQuery = useDeferredValue(draftQuery);

  useEffect(() => {
    setDraftQuery(query);
    setIsRouting(false);
  }, [query]);

  const navigateToSearch = useEffectEvent((nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();
    const nextPath = trimmedQuery ? `${pathname}?q=${encodeURIComponent(trimmedQuery)}` : pathname;

    setIsRouting(true);
    startTransition(() => {
      router.replace(nextPath, { scroll: false });
    });
  });

  useEffect(() => {
    const deferredTrimmed = deferredQuery.trim();
    const activeTrimmed = query.trim();

    if (deferredTrimmed === activeTrimmed) {
      return;
    }

    const timeout = window.setTimeout(() => {
      navigateToSearch(deferredQuery);
    }, 160);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [deferredQuery, query]);

  useEffect(() => {
    const onFocusSearch = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    window.addEventListener("koko-focus-ayah-search", onFocusSearch);

    return () => {
      window.removeEventListener("koko-focus-ayah-search", onFocusSearch);
    };
  }, []);

  return (
    <div className="mt-2 flex flex-col gap-5">
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-[linear-gradient(180deg,var(--gray-a2),transparent)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--pink-a3),transparent_42%)] opacity-90" />
        <div className="relative px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-muted text-small uppercase tracking-[0.14em]">Search Ayahs</p>
              <h1 className="mt-1 text-[1.8rem] leading-tight sm:text-[2.15rem]">Find words inside the Quran</h1>
              <p className="mt-2 max-w-[46ch] text-muted">
                Search across ayahs in Arabic, or jump straight to a verse with a reference like <kbd>2:255</kbd>.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background/80 px-4 text-muted text-small transition-colors hover:bg-gray-a2 hover:text-foreground"
            >
              <span>Browse surahs</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" size={16} />
              <input
                ref={inputRef}
                id="ayah-search-input"
                type="text"
                inputMode="search"
                enterKeyHint="search"
                placeholder="Search ayahs or type a verse reference"
                value={draftQuery}
                className="h-12 w-full rounded-[16px] border border-border bg-background/90 pr-12 pl-10 text-[0.98rem] outline-none transition-colors placeholder:text-muted focus:border-gray-7"
                onChange={(event) => {
                  setDraftQuery(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    navigateToSearch(draftQuery);
                  }
                }}
              />

              {draftQuery ? (
                <button
                  type="button"
                  className="absolute top-1/2 right-1 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[12px] text-muted transition-colors hover:bg-gray-a2 hover:text-foreground"
                  aria-label="Clear ayah search"
                  onClick={() => {
                    setDraftQuery("");
                    navigateToSearch("");
                    inputRef.current?.focus();
                  }}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-muted text-small">
              {quickSearches.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border border-border bg-background/70 px-3 py-1.5 transition-colors hover:bg-gray-a2 hover:text-foreground"
                  onClick={() => {
                    setDraftQuery(suggestion);
                    navigateToSearch(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-between gap-3 border-border border-b pb-3">
        <div>
          <h2 className="text-muted text-small uppercase tracking-[0.14em]">Results</h2>
          <p className="mt-1 text-muted">{resultSummary(results.length, totalResults)}</p>
        </div>

        {isRouting ? (
          <div className="inline-flex items-center gap-2 text-muted text-small">
            <LoaderCircle size={14} className="animate-spin" />
            <span>Searching...</span>
          </div>
        ) : null}
      </section>

      {!query.trim() ? (
        <div className="rounded-[22px] border border-border border-dashed bg-gray-a1 px-5 py-10 text-center">
          <p className="text-lg">Start with an Arabic word or an ayah reference.</p>
          <p className="mt-2 text-muted">Try something like الرحمن, الصبر, or 2:255.</p>
        </div>
      ) : null}

      {query.trim() && isTooShort ? (
        <div className="rounded-[22px] border border-border border-dashed bg-gray-a1 px-5 py-10 text-center">
          <p className="text-lg">Type at least 2 letters to search ayahs.</p>
          <p className="mt-2 text-muted">Verse references like 2:255 work even with numbers.</p>
        </div>
      ) : null}

      {query.trim() && !isTooShort && totalResults === 0 ? (
        <div className="rounded-[22px] border border-border border-dashed bg-gray-a1 px-5 py-10 text-center">
          <p className="text-lg">No ayahs matched “{query}”.</p>
          <p className="mt-2 text-muted">Try a shorter Arabic word, or search with a verse reference like 36:58.</p>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="flex flex-col gap-3">
          {results.map((result) => (
            <Link
              key={`${result.surahId}-${result.ayahId}`}
              href={`/${result.surahSlug}#ayah-${result.ayahId}`}
              className="group/result rounded-[22px] border border-border bg-background/80 px-4 py-4 transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-gray-6 hover:bg-gray-a2/70 hover:shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:px-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-muted text-small">
                    <span className="rounded-full border border-border bg-gray-a1 px-2.5 py-1">Surah {result.surahId}</span>
                    <span>Ayah {result.ayahId}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>{result.revelationLabel}</span>
                  </div>

                  <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="max-w-full truncate font-medium text-[1.02rem] transition-colors duration-300 group-hover/result:text-pink-11">
                      {result.surahTransliteration}
                    </span>
                    <span
                      lang="ar"
                      className="arabic-inline arabic-name shrink-0 font-arabic-title transition-colors duration-300 group-hover/result:text-pink-11"
                    >
                      {result.surahName}
                    </span>
                    <span className="text-muted">·</span>
                    <span className="truncate text-muted">{result.surahTranslation}</span>
                  </div>
                </div>

                <span className="hidden shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-muted text-small transition-colors duration-300 group-hover/result:text-foreground sm:inline-flex">
                  <span>Open</span>
                  <ArrowRight size={13} />
                </span>
              </div>

              <p lang="ar" className="arabic-inline arabic-verse mt-4 text-right font-arabic-body">
                {highlightVerse(result.verseText, query)} <span className="align-baseline text-muted">﴿{toArabicNumber(result.ayahId)}﴾</span>
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};
