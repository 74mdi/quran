export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  featured?: boolean;
  getAudioUrl: (surahNumber: number) => string;
}

const toThreeDigits = (surahNumber: number) => String(surahNumber).padStart(3, "0");

export const reciters: Reciter[] = [
  {
    id: "husary",
    name: "Mahmoud Khalil Al-Husary",
    arabicName: "محمود خليل الحصري",
    featured: true,
    getAudioUrl: (surahNumber) => `https://archive.org/download/MahmoudKhalilAl-husary/${toThreeDigits(surahNumber)}.mp3`,
  },
  {
    id: "sudais",
    name: "Abdul Rahman Al-Sudais",
    arabicName: "عبد الرحمن السديس",
    getAudioUrl: (surahNumber) => `https://download.quranicaudio.com/quran/abdurrahmaan_as-sudais_and_saud_ash-shuraim/${toThreeDigits(surahNumber)}.mp3`,
  },
  {
    id: "minshawi",
    name: "Mohamed Siddiq Al-Minshawi",
    arabicName: "محمد صديق المنشاوي",
    getAudioUrl: (surahNumber) => `https://download.quranicaudio.com/quran/muhammad_siddeeq_al-minshaawee/${toThreeDigits(surahNumber)}.mp3`,
  },
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    arabicName: "مشاري راشد العفاسي",
    getAudioUrl: (surahNumber) => `https://download.quranicaudio.com/quran/mishaari_raashid_al_afaasee/${toThreeDigits(surahNumber)}.mp3`,
  },
];

export const defaultReciterId = "husary";

export const getReciterById = (reciterId: string) => {
  return reciters.find((reciter) => reciter.id === reciterId) ?? reciters[0];
};
