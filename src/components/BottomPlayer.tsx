"use client";

import { ArrowRight, Download, Loader2, Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Timer, Volume1, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { usePlayerActions, usePlayerState, usePlayerTiming } from "@/src/context/PlayerContext";
import { reciters } from "@/src/data/reciters";

interface SeekBarProps {
  id: string;
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (value: number) => void;
}

const formatTime = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "00:00";
  }

  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const sanitizeFilenamePart = (value: string) => {
  return value
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const SeekBar = memo(({ id, currentTime, duration, buffered, onSeek }: SeekBarProps) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="player-seek-group group relative h-5">
      <div className="absolute top-1/2 h-[3px] w-full -translate-y-1/2 overflow-hidden rounded-full bg-gray-4 transition-all duration-150 group-hover:h-[5px] group-active:h-[5px]">
        <div className="absolute inset-y-0 left-0 bg-pink-a6 transition-[width] duration-100 ease-linear" style={{ width: `${bufferedProgress}%` }} />
        <div className="absolute inset-y-0 left-0 bg-pink-9 transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} />
      </div>

      <span
        className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-pink-9 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-active:opacity-100"
        style={{ left: `calc(${progress}% - 6px)` }}
      />

      <input
        id={id}
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        className="player-range absolute inset-0 h-full w-full"
        onChange={(event) => {
          onSeek(Number(event.target.value));
        }}
      />
    </div>
  );
});

SeekBar.displayName = "SeekBar";

const BottomPlayerBase = () => {
  const {
    play,
    pause,
    seekTo,
    playNextSurah,
    playPreviousSurah,
    setReciter,
    cyclePlaybackMode,
    cycleSleepTimer,
    setVolume,
    toggleMute,
    retry,
    closePlayer,
    dismissToast,
  } = usePlayerActions();

  const { isVisible, isLoading, error, toastMessage, currentSurah, currentReciter, currentReciterId, audioUrl, playbackMode, sleepRemainingSeconds, volume } =
    usePlayerState();

  const { isPlaying, currentTime, duration, buffered } = usePlayerTiming();

  const [sleepHint, setSleepHint] = useState<string | null>(null);
  const sleepHintTimeoutRef = useRef<number | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sleepHintTimeoutRef.current) {
        window.clearTimeout(sleepHintTimeoutRef.current);
      }
    };
  }, []);

  const showSleepHint = useCallback((minutes: number | null) => {
    setSleepHint(minutes ? `${minutes} min` : "Off");

    if (sleepHintTimeoutRef.current) {
      window.clearTimeout(sleepHintTimeoutRef.current);
    }

    sleepHintTimeoutRef.current = window.setTimeout(() => {
      setSleepHint(null);
      sleepHintTimeoutRef.current = null;
    }, 1400);
  }, []);

  const surahPath = currentSurah ? `/${currentSurah.slug}` : "/";
  const filename = currentSurah
    ? `${String(currentSurah.id).padStart(3, "0")}-${sanitizeFilenamePart(currentSurah.transliteration)}-${sanitizeFilenamePart(currentReciter.name)}.mp3`
    : "surah.mp3";

  const modeIcon = playbackMode === "repeat" ? <Repeat1 size={16} /> : playbackMode === "auto-next" ? <Repeat size={16} /> : <ArrowRight size={16} />;
  const modeClassName = playbackMode === "normal" ? "text-muted" : "text-pink-9";

  const sleepBadge = sleepRemainingSeconds ? `${Math.max(1, Math.ceil(sleepRemainingSeconds / 60))}m` : null;
  const isSleepWarning = sleepRemainingSeconds !== null && sleepRemainingSeconds <= 60;

  const volumeIcon = volume <= 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />;

  const volumeStyle = {
    "--player-volume-progress": `${Math.round(volume * 100)}%`,
  } as React.CSSProperties;

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }

    void play();
  }, [isPlaying, pause, play]);

  const downloadCurrentSurah = useCallback(() => {
    if (!audioUrl) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = audioUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }, [audioUrl, filename]);

  const handleSleepCycle = useCallback(() => {
    const nextMinutes = cycleSleepTimer();
    showSleepHint(nextMinutes);
  }, [cycleSleepTimer, showSleepHint]);

  const cycleReciter = useCallback(() => {
    const currentIndex = reciters.findIndex((reciter) => reciter.id === currentReciterId);
    const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextReciter = reciters[(normalizedIndex + 1) % reciters.length];

    if (!nextReciter) {
      return;
    }

    void setReciter(nextReciter.id);
  }, [currentReciterId, setReciter]);

  const onMobileTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    touchStartXRef.current = touch?.clientX ?? null;
    touchStartYRef.current = touch?.clientY ?? null;
  };

  const onMobileTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (startX === null || startY === null) {
      return;
    }

    const touch = event.changedTouches[0];

    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX > 0) {
      void playPreviousSurah();
      return;
    }

    void playNextSurah();
  };

  if (!currentSurah || !isVisible) {
    return null;
  }

  return (
    <>
      {toastMessage && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-base border border-border bg-background/95 px-3 py-2 text-small shadow-sm backdrop-blur-sm">
            <span>{toastMessage}</span>
            <button type="button" className="text-muted transition-colors hover:text-foreground" onClick={dismissToast}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-border border-t bg-background/90 backdrop-blur-[12px]">
        <div className="mx-auto max-w-screen-sm px-3 py-1 md:px-4 md:py-3">
          {error && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-base border border-border bg-background/90 px-2 py-1 text-muted text-small">
              <span>{error}</span>
              <button
                type="button"
                className="flex h-9 items-center rounded-small px-2 text-foreground transition-colors hover:bg-gray-a2"
                onClick={() => {
                  void retry();
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div className="hidden md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,2.8fr)_minmax(0,2fr)] md:items-center md:gap-3">
            <Link href={surahPath} className="flex min-w-0 items-center gap-3 rounded-base p-1 transition-colors hover:bg-gray-a2 hover:opacity-100">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-base border border-border bg-gray-a2 text-small">
                {String(currentSurah.id).padStart(3, "0")}
              </div>

              <div className="min-w-0">
                <p className="truncate font-medium">{currentSurah.transliteration}</p>
                <p lang="ar" className="arabic-inline truncate font-arabic-title text-muted">
                  {currentSurah.name}
                </p>
                <button
                  type="button"
                  className="truncate text-left text-muted text-small transition-colors hover:text-foreground"
                  title="Change reciter"
                  onClick={(event) => {
                    event.preventDefault();
                    cycleReciter();
                  }}
                >
                  {currentReciter.name}
                </button>
              </div>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-base border border-border transition-colors hover:bg-gray-a2"
                  aria-label="Previous surah"
                  title="Previous surah"
                  onClick={() => {
                    void playPreviousSurah();
                  }}
                >
                  <SkipBack size={15} />
                </button>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-gray-a2"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  title={isPlaying ? "Pause" : "Play"}
                  onClick={togglePlayback}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-base border border-border transition-colors hover:bg-gray-a2"
                  aria-label="Next surah"
                  title="Next surah"
                  onClick={() => {
                    void playNextSurah();
                  }}
                >
                  <SkipForward size={15} />
                </button>
              </div>

              <div className="mt-2">
                <SeekBar
                  id="desktop-player-seek"
                  currentTime={currentTime}
                  duration={duration}
                  buffered={buffered}
                  onSeek={(nextValue) => {
                    seekTo(nextValue);
                  }}
                />

                <div className="mt-1 flex items-center justify-between text-muted text-small">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                className={`flex h-8 w-8 items-center justify-center rounded-base border border-border transition-colors hover:bg-gray-a2 ${modeClassName}`}
                title="Playback mode"
                aria-label="Playback mode"
                onClick={cyclePlaybackMode}
              >
                {modeIcon}
              </button>

              <div className="relative">
                {sleepHint && (
                  <span className="absolute -top-8 right-0 whitespace-nowrap rounded-small border border-border bg-background px-2 py-1 text-small">
                    {sleepHint}
                  </span>
                )}

                <button
                  type="button"
                  className={`relative flex h-8 w-8 items-center justify-center rounded-base border border-border transition-colors hover:bg-gray-a2 ${
                    sleepRemainingSeconds ? "text-pink-9" : "text-muted"
                  } ${isSleepWarning ? "animate-pulse" : ""}`}
                  title="Sleep timer"
                  aria-label="Sleep timer"
                  onClick={handleSleepCycle}
                >
                  <Timer size={16} />
                  {sleepBadge && <span className="absolute -top-1 -right-1 rounded-small bg-pink-9 px-1 text-[10px] text-white leading-4">{sleepBadge}</span>}
                </button>
              </div>

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-base border border-border text-muted transition-colors hover:bg-gray-a2"
                title={volume <= 0 ? "Unmute" : "Mute"}
                aria-label={volume <= 0 ? "Unmute" : "Mute"}
                onClick={toggleMute}
              >
                {volumeIcon}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                className="player-volume-range"
                style={volumeStyle}
                title="Volume"
                aria-label="Volume"
                onChange={(event) => {
                  setVolume(Number(event.target.value));
                }}
              />

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-base border border-border text-muted transition-colors hover:bg-gray-a2"
                title="Download surah"
                aria-label="Download surah"
                onClick={downloadCurrentSurah}
              >
                <Download size={16} />
              </button>

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-base border border-border text-muted transition-colors hover:bg-gray-a2"
                title="Close player"
                aria-label="Close player"
                onClick={closePlayer}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="md:hidden" onTouchStart={onMobileTouchStart} onTouchEnd={onMobileTouchEnd}>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-base border border-border transition-colors hover:bg-gray-a2"
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={togglePlayback}
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <Link href={surahPath} className="min-w-0 flex-1 rounded-base px-1 py-0.5 transition-colors hover:bg-gray-a2 hover:opacity-100">
                <p className="truncate font-medium">
                  {currentSurah.transliteration} ·{" "}
                  <span lang="ar" className="font-arabic-title">
                    {currentSurah.name}
                  </span>
                </p>
              </Link>

              <button
                type="button"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-base border border-border transition-colors hover:bg-gray-a2 ${modeClassName}`}
                title="Playback mode"
                aria-label="Playback mode"
                onClick={cyclePlaybackMode}
              >
                {modeIcon}
              </button>

              <div className="relative">
                {sleepHint && (
                  <span className="absolute -top-8 right-0 whitespace-nowrap rounded-small border border-border bg-background px-2 py-1 text-small">
                    {sleepHint}
                  </span>
                )}

                <button
                  type="button"
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-base border border-border transition-colors hover:bg-gray-a2 ${
                    sleepRemainingSeconds ? "text-pink-9" : "text-muted"
                  } ${isSleepWarning ? "animate-pulse" : ""}`}
                  title="Sleep timer"
                  aria-label="Sleep timer"
                  onClick={handleSleepCycle}
                >
                  <Timer size={16} />
                  {sleepBadge && <span className="absolute -top-1 -right-1 rounded-small bg-pink-9 px-1 text-[10px] text-white leading-4">{sleepBadge}</span>}
                </button>
              </div>

              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-base border border-border text-muted transition-colors hover:bg-gray-a2"
                title="Close player"
                aria-label="Close player"
                onClick={closePlayer}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-0.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <SeekBar
                  id="mobile-player-seek"
                  currentTime={currentTime}
                  duration={duration}
                  buffered={buffered}
                  onSeek={(nextValue) => {
                    seekTo(nextValue);
                  }}
                />
              </div>

              <span className="w-[98px] text-right text-muted text-small">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const BottomPlayer = memo(BottomPlayerBase);
BottomPlayer.displayName = "BottomPlayer";
