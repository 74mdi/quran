# Koko Quran

Read and listen to the Holy Quran with all 114 surahs, Arabic text, real-time search, and a persistent bottom audio player.

## Features

- Surah list with live search
- Static Surah reading pages (`/[surah]`) for all 114 surahs
- Persistent site-wide audio player with reciter switching
- Approximate ayah highlighting while audio plays
- Keyboard shortcut `/` to focus search (or open search on inner pages)

## Data setup

Download the Quran JSON once:

```bash
node scripts/fetch-quran.js
```

This saves data to `src/data/quran.json`.

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run start
```
