import type { MetadataRoute } from "next";

import { surahMeta } from "@/src/data/quran";
import { getSiteUrl } from "@/src/lib/site-url";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...surahMeta.map((surah) => ({
      url: `${siteUrl}/${surah.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
