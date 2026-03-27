import { AppThemeProvider } from "@/components/theme";
import { PlayerProvider } from "@/src/context/PlayerContext";
import type { SurahMeta } from "@/src/types/quran";

interface ProvidersProps {
  children: React.ReactNode;
  surahs: SurahMeta[];
}

export const Providers = ({ children, surahs }: ProvidersProps) => {
  return (
    <AppThemeProvider>
      <PlayerProvider surahs={surahs}>{children}</PlayerProvider>
    </AppThemeProvider>
  );
};
