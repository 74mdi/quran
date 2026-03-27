#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const QURAN_URL = "https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json";
const OUTPUT_PATH = path.join(process.cwd(), "src", "data", "quran.json");

async function fetchQuran() {
  const response = await fetch(QURAN_URL);

  if (!response.ok) {
    throw new Error(`Failed to download Quran data: ${response.status} ${response.statusText}`);
  }

  const quran = await response.json();

  if (!Array.isArray(quran) || quran.length !== 114) {
    throw new Error("Downloaded Quran data is invalid. Expected an array of 114 surahs.");
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(quran, null, 2)}\n`, "utf8");

  console.log(`Saved Quran data to ${OUTPUT_PATH}`);
}

fetchQuran().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
