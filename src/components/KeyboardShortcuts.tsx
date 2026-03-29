"use client";

import { Keyboard, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayer } from "@/src/context/PlayerContext";
import { hasOpenModal, isDesktopKeyboardEnvironment, isEditableElement, keyboardShortcutEvents } from "@/src/lib/keyboard-shortcuts";

const DESKTOP_MEDIA_QUERIES = ["(min-width: 768px)", "(hover: hover)", "(pointer: coarse)"];
const SEEK_STEP_SECONDS = 10;

const shortcutGroups = [
  {
    title: "Search & navigation",
    items: [
      { keys: ["/"], description: "Search surahs or jump to the list" },
      { keys: ["O"], description: "Open the currently playing surah page" },
      { keys: ["["], description: "Go to the previous surah page" },
      { keys: ["]"], description: "Go to the next surah page" },
      { keys: ["?"], description: "Open this shortcuts guide" },
    ],
  },
  {
    title: "Player",
    items: [
      { keys: ["K", "Space"], description: "Play or pause the recitation" },
      { keys: ["J"], description: "Seek back 10 seconds" },
      { keys: ["L"], description: "Seek forward 10 seconds" },
      { keys: ["P"], description: "Play the previous surah" },
      { keys: ["N"], description: "Play the next surah" },
      { keys: ["M"], description: "Mute or unmute audio" },
      { keys: ["R"], description: "Cycle playback mode" },
      { keys: ["S"], description: "Cycle the sleep timer" },
    ],
  },
  {
    title: "Reader",
    items: [
      { keys: ["C"], description: "Copy the Arabic text on a surah page" },
      { keys: ["I"], description: "Toggle ayah highlighting on a surah page" },
      { keys: ["Esc"], description: "Close open dialogs" },
    ],
  },
] as const;

const isQuestionShortcut = (event: KeyboardEvent) => {
  return event.key === "?" || (event.key === "/" && event.shiftKey);
};

export const KeyboardShortcuts = () => {
  const pathname = usePathname();
  const router = useTransitionRouter();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const {
    currentSurah,
    currentTime,
    duration,
    isPlaying,
    isVisible,
    play,
    pause,
    seekTo,
    playNextSurah,
    playPreviousSurah,
    cyclePlaybackMode,
    cycleSleepTimer,
    toggleMute,
  } = usePlayer();

  const syncEnvironment = useCallback(() => {
    setEnabled(isDesktopKeyboardEnvironment());
  }, []);

  useEffect(() => {
    syncEnvironment();

    const mediaQueries = DESKTOP_MEDIA_QUERIES.map((query) => window.matchMedia(query));
    mediaQueries.forEach((query) => {
      query.addEventListener("change", syncEnvironment);
    });

    return () => {
      mediaQueries.forEach((query) => {
        query.removeEventListener("change", syncEnvironment);
      });
    };
  }, [syncEnvironment]);

  useEffect(() => {
    if (!enabled) {
      setIsOpen(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 10);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isOpen]);

  const openSearch = useCallback(() => {
    window.dispatchEvent(new Event(keyboardShortcutEvents.openSearch));
  }, []);

  const openCurrentSurah = useCallback(() => {
    if (!currentSurah) {
      return;
    }

    router.push(`/${currentSurah.slug}`);
  }, [currentSurah, router]);

  const dispatchPageShortcut = useCallback((eventName: string) => {
    window.dispatchEvent(new Event(eventName));
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }

    void play();
  }, [isPlaying, pause, play]);

  const isPlayerReady = Boolean(currentSurah) || isVisible;
  const currentSurahPath = currentSurah ? `/${currentSurah.slug}` : null;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.repeat && (event.key === " " || event.code === "Space" || event.key.toLowerCase() === "k")) {
        return;
      }

      if (isOpen) {
        if (event.key === "Escape" || isQuestionShortcut(event)) {
          event.preventDefault();
          setIsOpen(false);
        }

        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (hasOpenModal()) {
        return;
      }

      if (isEditableElement(event.target)) {
        return;
      }

      if (isQuestionShortcut(event)) {
        event.preventDefault();
        setIsOpen(true);
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        openSearch();
        return;
      }

      if (event.key === " " || event.code === "Space") {
        if (!isPlayerReady && pathname === "/") {
          return;
        }

        event.preventDefault();

        if (pathname !== "/" && pathname !== currentSurahPath) {
          dispatchPageShortcut(keyboardShortcutEvents.playCurrentSurah);
          return;
        }

        togglePlayback();
        return;
      }

      switch (event.key.toLowerCase()) {
        case "k": {
          event.preventDefault();

          if (pathname !== "/" && pathname !== currentSurahPath) {
            dispatchPageShortcut(keyboardShortcutEvents.playCurrentSurah);
            return;
          }

          togglePlayback();
          return;
        }

        case "j": {
          if (!currentSurah || duration <= 0) {
            return;
          }

          event.preventDefault();
          seekTo(Math.max(0, currentTime - SEEK_STEP_SECONDS));
          return;
        }

        case "l": {
          if (!currentSurah || duration <= 0) {
            return;
          }

          event.preventDefault();
          seekTo(Math.min(duration, currentTime + SEEK_STEP_SECONDS));
          return;
        }

        case "p": {
          if (!isPlayerReady) {
            return;
          }

          event.preventDefault();
          void playPreviousSurah();
          return;
        }

        case "n": {
          if (!isPlayerReady) {
            return;
          }

          event.preventDefault();
          void playNextSurah();
          return;
        }

        case "m": {
          if (!isPlayerReady) {
            return;
          }

          event.preventDefault();
          toggleMute();
          return;
        }

        case "r": {
          if (!isPlayerReady) {
            return;
          }

          event.preventDefault();
          cyclePlaybackMode();
          return;
        }

        case "s": {
          if (!isPlayerReady) {
            return;
          }

          event.preventDefault();
          cycleSleepTimer();
          return;
        }

        case "o": {
          if (!currentSurah) {
            return;
          }

          event.preventDefault();
          openCurrentSurah();
          return;
        }

        case "c": {
          if (pathname === "/") {
            return;
          }

          event.preventDefault();
          dispatchPageShortcut(keyboardShortcutEvents.copySurahText);
          return;
        }

        case "i": {
          if (pathname === "/") {
            return;
          }

          event.preventDefault();
          dispatchPageShortcut(keyboardShortcutEvents.toggleHighlight);
          return;
        }

        default:
          break;
      }

      if (event.key === "[") {
        if (pathname === "/") {
          return;
        }

        event.preventDefault();
        dispatchPageShortcut(keyboardShortcutEvents.goPreviousSurahPage);
        return;
      }

      if (event.key === "]") {
        if (pathname === "/") {
          return;
        }

        event.preventDefault();
        dispatchPageShortcut(keyboardShortcutEvents.goNextSurahPage);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    currentSurah,
    currentTime,
    cyclePlaybackMode,
    cycleSleepTimer,
    dispatchPageShortcut,
    duration,
    enabled,
    currentSurahPath,
    isOpen,
    isPlayerReady,
    openCurrentSurah,
    openSearch,
    pathname,
    playNextSurah,
    playPreviousSurah,
    seekTo,
    toggleMute,
    togglePlayback,
  ]);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-base text-muted transition-colors hover:bg-gray-a2 hover:text-foreground"
        aria-label="Open keyboard shortcuts"
        aria-keyshortcuts="Shift+/"
        title="Keyboard shortcuts (?)"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Keyboard size={14} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black-a8/95 px-4 py-6 backdrop-blur-[3px] sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setIsOpen(false);
            }
          }}
        >
          <div className="mx-auto flex h-full max-w-md items-center sm:items-start sm:pt-16">
            <div className="w-full overflow-hidden rounded-[20px] border border-border bg-background/95 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
              <div className="border-border/80 border-b px-4 py-3 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-a2 px-2.5 py-1 text-[11px] text-muted uppercase tracking-[0.08em]">
                      <Keyboard size={11} />
                      Keybinds
                    </span>
                    <h2 className="mt-2 font-medium text-[15px] text-foreground sm:text-base">Keyboard shortcuts</h2>
                    <p className="mt-1 max-w-[30ch] text-[12px] text-muted leading-5 sm:text-small">
                      {enabled
                        ? "Made for desktop keyboards. They stay off while you type in fields or use dialogs."
                        : "Quick guide for desktop shortcuts. They stay inactive on touch-first mobile devices."}
                    </p>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-base text-muted transition-colors hover:bg-gray-a2 hover:text-foreground"
                    aria-label="Close keyboard shortcuts"
                    onClick={() => {
                      setIsOpen(false);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-[min(68vh,32rem)] overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
                <div className="space-y-3">
                  {shortcutGroups.map((group) => (
                    <section key={group.title} className="rounded-[16px] border border-border/80 bg-gray-a1/70 p-3 sm:p-3.5">
                      <h3 className="font-medium text-[12px] text-muted uppercase tracking-[0.08em]">{group.title}</h3>
                      <ul className="mt-3 list-none space-y-2.5">
                        {group.items.map((item) => (
                          <li key={`${group.title}-${item.description}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                            <span className="text-[13px] leading-5 sm:text-small">{item.description}</span>
                            <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                              {item.keys.map((key) => (
                                <kbd key={`${group.title}-${item.description}-${key}`}>{key}</kbd>
                              ))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
