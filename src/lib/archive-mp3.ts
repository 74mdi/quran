/** Al-Husary full-surah MP3s on Archive.org (identifier matches existing player convention). */
export const archiveHusaryMp3Url = (surahId: number) => {
  const padded = String(surahId).padStart(3, "0");
  return `https://archive.org/download/MahmoudKhalilAl-husary/${padded}.mp3`;
};
