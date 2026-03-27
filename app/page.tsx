import { Suspense } from "react";
import { SurahList } from "@/src/components/SurahList";
import { surahMeta } from "@/src/data/quran";

export default function Page() {
  return (
    <Suspense fallback={<p className="mt-6 text-muted">Loading surahs...</p>}>
      <SurahList surahs={surahMeta} />
    </Suspense>
  );
}
