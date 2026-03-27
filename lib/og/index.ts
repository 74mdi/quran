import type { Metadata } from "next/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const OpenGraph: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Koko Quran",
    template: "%s",
  },
  description: "Read and listen to the Holy Quran — all 114 Surahs in beautiful Arabic",
  keywords: ["Quran", "Surahs", "Recitation", "Arabic", "Koko Quran"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Koko Quran",
    description: "Read and listen to the Holy Quran — all 114 Surahs in beautiful Arabic",
    images: siteUrl ? [`${siteUrl}api/og`] : undefined,
    siteName: "Koko Quran",
  },
  twitter: {
    card: "summary_large_image",
    title: "Koko Quran",
    description: "Read and listen to the Holy Quran — all 114 Surahs in beautiful Arabic",
    images: siteUrl ? [`${siteUrl}api/og`] : undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
