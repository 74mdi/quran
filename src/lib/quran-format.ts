export const bismillah = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

const ARABIC_NUMERALS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export const toArabicNumber = (value: number) => {
  return String(value)
    .split("")
    .map((digit) => ARABIC_NUMERALS[Number(digit)] ?? digit)
    .join("");
};
