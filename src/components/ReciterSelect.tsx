"use client";

import { Mic2 } from "lucide-react";
import { usePlayer } from "@/src/context/PlayerContext";
import { reciters } from "@/src/data/reciters";

interface ReciterSelectProps {
  compact?: boolean;
  className?: string;
}

export const ReciterSelect = ({ compact = false, className }: ReciterSelectProps) => {
  const { currentReciterId, setReciter } = usePlayer();
  const currentReciter = reciters.find((reciter) => reciter.id === currentReciterId) ?? reciters[0];
  const currentShortName = currentReciter.name.split(" ")[0] ?? currentReciter.name;

  const onChangeReciter = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    await setReciter(event.target.value);
  };

  if (compact) {
    return (
      <label
        className={`relative flex h-11 min-w-[92px] max-w-[160px] cursor-pointer items-center gap-1 rounded-base border border-border px-2 pr-8 text-foreground text-small ${className ?? ""}`}
      >
        <Mic2 size={14} className="shrink-0 text-muted" />
        <span className="reciter-compact-label-full truncate">{currentReciter.name}</span>
        <span className="reciter-compact-label-short truncate">{currentShortName}</span>
        <span className="sr-only">Select reciter</span>
        <select
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Select reciter"
          value={currentReciterId}
          onChange={(event) => {
            void onChangeReciter(event);
          }}
        >
          {reciters.map((reciter) => (
            <option key={reciter.id} value={reciter.id}>
              {reciter.name}
              {reciter.featured ? " (Default)" : ""}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="relative min-w-0">
      <span className="sr-only">Select reciter</span>
      <select
        className="h-11 min-w-[220px] rounded-base border border-border bg-background px-2 text-foreground text-small"
        aria-label="Select reciter"
        value={currentReciterId}
        onChange={(event) => {
          void onChangeReciter(event);
        }}
      >
        {reciters.map((reciter) => (
          <option key={reciter.id} value={reciter.id}>
            {reciter.name}
            {reciter.featured ? " (Default)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
};
