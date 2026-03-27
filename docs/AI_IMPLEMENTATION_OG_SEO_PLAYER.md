# AI-oriented implementation notes: OG images, SEO, and bottom player

This document describes **what was implemented and why**, so another AI or developer can understand the codebase changes without reading the full diff. It was written after a single implementation pass on the **Koko Quran** Next.js (App Router) project.

---

## Scope summary

| Area                | Intent                                                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Open Graph (OG)** | Dynamic `ImageResponse` images per surah via `/api/og`, edge runtime, 1200×630.                                                                                   |
| **SEO**             | Site-wide and per-surah metadata, canonical URLs, sitemap/robots policy, home page overrides.                                                                     |
| **Bottom player**   | Desktop: full-width bottom bar (280px \| flex center \| 280px). Mobile: compact two-row bar. Custom seekbar (no range input for seek). Archive.org download link. |

---

## File change map

| File                               | Role                                                                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/og/route.tsx`             | OG image generation (`next/og`). **Note:** file is `.tsx` because the handler returns JSX for `ImageResponse`.                                                                     |
| `app/layout.tsx`                   | Root `metadata`, removed `OpenGraph` import from `lib/og`; `<main>` no longer uses fixed `pb-48` (padding when player is visible is CSS-driven).                                   |
| `app/page.tsx`                     | Home `metadata` including `title.absolute` to avoid double-appending the layout title template.                                                                                    |
| `app/[surah]/page.tsx`             | Extended `generateMetadata` with OG/Twitter images, `canonical` via `alternates`, descriptions using `SurahMeta` fields.                                                           |
| `next-sitemap.config.js`           | `siteUrl`, robots policies (`disallow: /api/`), `exclude`, `changefreq`, `priority`, `sitemapSize`.                                                                                |
| `styles/main.css`                  | Large `@layer utilities` block: `.bottom-player`, desktop grid, seekbar, volume, mobile rows, `body:has(.bottom-player) main` padding, toasts/error bar, mode/sleep button styles. |
| `src/components/BottomPlayer.tsx`  | Full rewrite: layout split, `Seekbar` (pointer events), `VolumeControl`, `ModeButton`, `DownloadArchiveButton`, uses `usePlayer()` hook.                                           |
| `src/components/ReciterSelect.tsx` | Optional `className` prop (for `.player-reciter-select` sizing in the bar).                                                                                                        |

**Orphaned / unused after changes:** `lib/og/index.ts` is no longer imported by `app/layout.tsx`. Safe to delete if nothing else imports it.

**Not changed:** `src/data/quran.json` shape; the app continues to use **`surahMeta`** from `src/data/quran.ts`, which merges JSON with translations and slugs.

---

## Task 1: Per-surah OG images (`/api/og`)

### Endpoint behavior

- **Method:** `GET`
- **Runtime:** `export const runtime = "edge"`
- **Query parameters:**
  - `surah` — numeric id as string, e.g. `?surah=36`
  - `name` — transliteration or slug-like string, e.g. `?name=Ya-Sin` or paths normalized like `al-fatihah`
- **Resolution order:** match by `String(s.id) === raw` → case-insensitive transliteration → `normalizeSurahSlug` on `slug` and `transliteration` → fallback `surahMeta[0]`.

### Data source

- Imports **`surahMeta`** from `@/src/data/quran` (not raw `quran.json`).
- Fields used on the card:
  - **Arabic title:** `surah.name`
  - **Latin name:** `surah.transliteration`
  - **English meaning:** `surah.translation`
  - **Revelation:** `surah.revelationLabel` (not a raw `type` string; human label like `Meccan` / `Medinan`)
  - **Length:** `surah.ayahCount` (labelled “Ayahs” on the image)

### Fonts

- **Inter (Latin UI text):** loaded from repo file `public/assets/inter/semi-bold.ttf` via `fetch(new URL("../../../public/assets/inter/semi-bold.ttf", import.meta.url))`, registered as weight `700` for `ImageResponse`.
- **Amiri (Arabic headline):** fetched at runtime from Google Fonts static URL `https://fonts.gstatic.com/s/amiri/v30/J7acnpd8CGxBHp2VkZY4.ttf` (TTF). If this fetch fails, Arabic may fall back poorly; the handler still returns an image.
- **Output size:** width `1200`, height `630`.

### Next.js build note

- The route appears as **dynamic** (`ƒ /api/og`) in build output. Edge runtime triggers a warning that static generation is disabled for that route (expected).

---

## Task 2: SEO and metadata wiring

### Root layout (`app/layout.tsx`)

- **`metadataBase`:** `new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://koko-quran.vercel.app")` so relative OG/Twitter image paths resolve correctly.
- **Title:** `default: "Koko Quran"`, **`template: "%s — Koko Quran"`** so child pages that set `title: "Some Title"` become `"Some Title — Koko Quran"`.
- **Open Graph / Twitter:** default site image `/api/og?surah=1`, dimensions 1200×630, `summary_large_image` for Twitter.
- **Robots:** index/follow + `googleBot.max-image-preview: large`.
- **Removed:** `import { OpenGraph } from "@/lib/og"` and spread of that object.

### Home page (`app/page.tsx`)

- Exports **`metadata`** with:
  - **`title: { absolute: "Koko Quran — Read the Holy Quran" }`** — avoids applying the layout template twice (without `absolute`, the title would become `"... — Koko Quran — Koko Quran"`).
  - Description and **`openGraph.images`** pointing at `/api/og?surah=1`.

### Surah page (`app/[surah]/page.tsx`)

- **`generateStaticParams`:** unchanged in spirit — still uses `surah: surah.slug` from `surahMeta`.
- **`generateMetadata`:**
  - **`title`:** `` `${transliteration} — ${name}` `` (Arabic `name` is the Arabic surah title from data).
  - **`description`:** includes transliteration, `translation`, id, `ayahCount`, `revelationLabel`.
  - **`openGraph`:** title like `` `${transliteration} · ${name}` ``, `url` and **`alternates.canonical`** use **`/${currentSurah.slug}`** — this matches the real App Router segment (e.g. `/Al-Fatihah`, `/Ya-Sin`), not a lowercased slug-only path unless the app uses that (it uses mixed case slugs from `toSlug` in `quran.ts`).
  - **OG/Twitter images:** relative `ogUrl` = `/api/og?surah=${id}`; Next resolves with `metadataBase`.

### Canonical URLs

- Per-surah **`<link rel="canonical">`** comes from **`alternates.canonical`** in `generateMetadata` (Next.js App Router convention). Verified in prerendered HTML: e.g. `https://koko-quran.vercel.app/Al-Fatihah` when `metadataBase` default is used.

### Sitemap (`next-sitemap.config.js`)

- **`siteUrl`:** `process.env.NEXT_PUBLIC_SITE_URL || "https://koko-quran.vercel.app"`.
- **`robotsTxtOptions.policies`:** allow `/`, disallow `/api/`.
- **`exclude`:** `["/api/*"]` — confirm your `next-sitemap` version respects this pattern for excluding OG routes from the sitemap.

---

## Task 3: Bottom player redesign

### Architecture

- **`BottomPlayer`** is a client component (`"use client"`).
- State and actions come from **`usePlayer()`** in `src/context/PlayerContext.tsx` (combined hook: state + timing + actions). **No new context API** was added.
- Root wrapper class: **`bottom-player`** (`position: fixed; bottom: 0; left/right: 0; z-index: 100; border-top; backdrop blur; no box-shadow per design note).

### Desktop (`player-desktop`, `md` breakpoint: width ≥ 768px)

- **CSS Grid:** `grid-template-columns: 280px 1fr 280px`, height `72px`, horizontal padding `24px`.
- **Left (`player-left`):** surah number badge, transliteration link to `/${slug}`, Arabic name, reciter name line.
- **Center (`player-center`):** prev / play-pause / next; seek row with current time, `Seekbar`, duration.
- **Right (`player-right`):** playback mode, sleep timer, volume (icon + slider), `ReciterSelect compact`, archive download link, close.

### Mobile (`player-mobile`, below 768px)

- **Row 1:** small play, link to surah (name + Arabic), mode button, close.
- **Row 2:** time | seekbar | time.
- **Sleep timer** is **not** duplicated on mobile row 1 in this implementation (desktop has full sleep UI); adjust if parity is required.

### `Seekbar` component

- **Does not** use `<input type="range">` for seeking.
- Uses **`onPointerDown` / `onPointerMove` / `onPointerUp` / `onPointerCancel`** on a container with **`setPointerCapture`** for drag-to-seek.
- Computes seek position from `getBoundingClientRect()` and `duration`; calls context **`seekTo(timeInSeconds)`**.
- **Keyboard:** ArrowLeft/ArrowRight on the slider element for coarse stepping (accessibility helper).
- Visual track: **`seekbar-track`**, filled **`seekbar-played`**, buffered **`seekbar-buffered`**, thumb **`seekbar-thumb`** (shows on hover).

### `VolumeControl`

- Icon button calls **`toggleMute`** (same semantics as before: restore previous volume when unmuting).
- **`<input type="range" class="volume-slider">`** for volume; **`setVolume`** from context.

### `ModeButton`

- **`PlaybackMode`:** `normal` → `ArrowRight`; `repeat` → `Repeat1`; `auto-next` → `Repeat`.
- **Styling:** “active” modes use **`mode-btn-active`** (`color: var(--foreground)`); idle uses **`mode-btn-idle`** (`color: var(--muted-foreground)`). These variables are set on **`.bottom-player`** to map to the project’s `--fg` / `--muted` / `--gray-a2` (`--accent`).

### `DownloadArchiveButton`

- **`href`:** `https://archive.org/download/MahmoudKhalilAl-husary/{id}.mp3` with **`String(surah.id).padStart(3, "0")`** (e.g. `001.mp3`).
- **Verify** the exact Archive.org identifier spelling in production (`MahmoudKhalilAl-husary` vs typos) — implementation followed the prompt’s URL pattern.

### Toasts and errors

- **Toast:** `player-toast-wrap` / `player-toast-inner`, `dismissToast`, positioned above the bar (`z-index: 110`).
- **Error strip:** `player-error-banner` with Retry calling **`retry()`**.

### Main content padding

- **`body:has(.bottom-player) main`** sets `padding-bottom: 72px` (desktop) and `100px` (mobile) so the fixed bar does not cover content.
- When the player returns `null` (closed or no surah), **`:has(.bottom-player)`** is false and extra padding is not applied.

### `ReciterSelect` change

- **`className?: string`** merged into the compact mode `<label>` so **`className="player-reciter-select"`** can reduce height/width inside the narrow right column.

---

## CSS variable mapping (player)

Inside **`.bottom-player`**, local aliases were added so prompt-style names work with this codebase:

- `--foreground` → `var(--fg)`
- `--background` → `var(--bg)`
- `--muted-foreground` → `var(--muted)`
- `--accent` → `var(--gray-a2)`

Radix/tailwind tokens like `--border`, `--pink-9` are used directly where specified (e.g. seek played color, sleep badge).

---

## Verification checklist (for humans or CI)

1. **`pnpm exec next build`** — compiles; `/api/og` listed as dynamic.
2. **OG image:** request `/api/og?surah=36` (and `?name=Ya-Sin`) locally or on deploy.
3. **HTML head:** for a built surah page, confirm unique `<title>`, `og:image` pointing to `/api/og?surah=<id>`, and `link[rel=canonical]`.
4. **Player:** desktop full width with three columns; mobile two rows without horizontal overflow.
5. **External:** share debugger (e.g. opengraph.xyz) against a public surah URL.

---

## Known follow-ups (optional)

- Remove or repurpose **`lib/og/index.ts`** if unused everywhere.
- Confirm **`next-sitemap` `exclude`** glob matches the installed package behavior.
- Confirm **Archive.org** path and file naming for all 114 surahs match the live archive item.

---

_End of document._
