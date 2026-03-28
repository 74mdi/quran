export const OG_IMAGE_VERSION = "20260328-1";

export const getOgImageUrl = (surahId: number) => {
  return `/api/og?surah=${surahId}&v=${OG_IMAGE_VERSION}`;
};
