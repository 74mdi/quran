import { memo } from "react";

import { cn } from "@/lib/cn";
import { toArabicNumber } from "@/src/lib/quran-format";
import type { QuranVerse } from "@/src/types/quran";

interface VerseBlockProps {
  verse: QuranVerse;
  isActive?: boolean;
}

const VerseBlockBase = ({ verse, isActive = false }: VerseBlockProps) => {
  return (
    <section
      id={`ayah-${verse.id}`}
      className={cn("scroll-mt-24 border-border border-t px-1 py-5 transition-colors duration-300", isActive ? "ayah-active" : "")}
    >
      <p lang="ar" className="arabic-inline arabic-verse text-right font-arabic-body">
        {verse.text} <span className="align-baseline text-muted">﴿{toArabicNumber(verse.id)}﴾</span>
      </p>
    </section>
  );
};

export const VerseBlock = memo(VerseBlockBase);
