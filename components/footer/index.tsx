import { Heart } from "lucide-react";
import { AppThemeSwitcher } from "@/components/theme";

const Footer = () => {
  return (
    <div className="flex w-full items-center justify-between border-border border-t pt-2">
      <div className="inline-flex items-center gap-1 px-[2px] text-muted text-small">
        <span>Built with</span>
        <Heart size={12} />
        <span>for the Quran</span>
      </div>
      <div className="text-muted text-small">
        <AppThemeSwitcher />
      </div>
    </div>
  );
};

export { Footer };
