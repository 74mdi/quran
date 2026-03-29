import { ArrowUp, Heart } from "lucide-react";
import { AppThemeSwitcher } from "@/components/theme";
import { KeyboardShortcuts } from "@/src/components/KeyboardShortcuts";

const Footer = () => {
  return (
    <div className="flex w-full items-center justify-between gap-3 border-border border-t pt-2">
      <div className="inline-flex items-center gap-1 px-[2px] text-muted text-small">
        <span>Built with</span>
        <Heart size={12} />
        <span>for the Quran</span>
      </div>

      <div className="flex items-center gap-1.5 text-muted text-small">
        <a
          href="#page-top"
          className="inline-flex h-8 w-8 items-center justify-center rounded-base text-muted transition-colors hover:bg-gray-a2 hover:text-foreground"
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp size={14} />
        </a>
        <KeyboardShortcuts />
        <AppThemeSwitcher />
      </div>
    </div>
  );
};

export { Footer };
