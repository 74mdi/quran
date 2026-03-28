"use client";

import { Download, ListMusic, Loader2, MoonStar, Pause, Play, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ReciterSelect } from "@/src/components/ReciterSelect";
import type { PlaybackMode } from "@/src/context/PlayerContext";
import { usePlayer } from "@/src/context/PlayerContext";
import { archiveHusaryMp3Url } from "@/src/lib/archive-mp3";
import type { SurahMeta } from "@/src/types/quran";

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

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

interface SeekbarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (timeInSeconds: number) => void;
}

const Seekbar = memo(({ currentTime, duration, buffered, onSeek }: SeekbarProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = ref.current;
      if (!el || duration <= 0) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const ratio = clamp01((clientX - rect.left) / rect.width);
      onSeek(ratio * duration);
    },
    [duration, onSeek],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    ref.current?.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!ref.current?.hasPointerCapture(e.pointerId)) {
      return;
    }
    setFromClientX(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (ref.current?.hasPointerCapture(e.pointerId)) {
      ref.current.releasePointerCapture(e.pointerId);
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={ref}
      className="seekbar-container"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration || 0)}
      aria-valuenow={Math.round(currentTime)}
      aria-label="Seek audio"
      onKeyDown={(e) => {
        if (!duration) {
          return;
        }
        const step = Math.max(5, duration * 0.02);
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          onSeek(Math.max(0, currentTime - step));
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          onSeek(Math.min(duration, currentTime + step));
        }
      }}
    >
      <div className="seekbar-track">
        <div className="seekbar-buffered" style={{ width: `${bufferedPct}%` }} />
        <div className="seekbar-played" style={{ width: `${progressPct}%` }} />
        <div className="seekbar-thumb" style={{ left: `${progressPct}%` }} />
      </div>
    </div>
  );
});

Seekbar.displayName = "Seekbar";

function ModeButton({ mode, onToggle, size = 16 }: { mode: PlaybackMode; onToggle: () => void; size?: number }) {
  const modeIcon = mode === "repeat" ? <Repeat1 size={size} /> : mode === "auto-next" ? <Shuffle size={size} /> : <ListMusic size={size} />;
  const modeLabel = mode === "repeat" ? "Repeat this surah" : mode === "auto-next" ? "Auto-advance to next surah" : "Play once (in order)";
  const active = mode !== "normal";

  return (
    <button
      type="button"
      className={active ? "mode-btn-active" : "mode-btn-idle"}
      title={modeLabel}
      aria-label={`Playback mode: ${modeLabel}`}
      onClick={onToggle}
    >
      {modeIcon}
    </button>
  );
}

function VolumeControl({ volume, onVolumeChange, onMuteToggle }: { volume: number; onVolumeChange: (v: number) => void; onMuteToggle: () => void }) {
  const icon = volume <= 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />;

  return (
    <div className="volume-control">
      <button
        type="button"
        className="player-icon-plain"
        title={volume <= 0 ? "Unmute" : "Mute"}
        aria-label={volume <= 0 ? "Unmute" : "Mute"}
        onClick={onMuteToggle}
      >
        {icon}
      </button>
      <input
        type="range"
        className="volume-slider"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        aria-label="Volume"
        onChange={(e) => {
          onVolumeChange(Number(e.target.value));
        }}
      />
    </div>
  );
}

function DownloadArchiveButton({ surah }: { surah: SurahMeta }) {
  const href = archiveHusaryMp3Url(surah.id);

  return (
    <a
      href={href}
      download
      rel="noopener noreferrer"
      className="player-icon-plain"
      title="Download surah (Al-Husary, Archive.org)"
      aria-label="Download surah MP3"
    >
      <Download size={16} />
    </a>
  );
}

const BottomPlayerBase = () => {
  const router = useRouter();
  const {
    isVisible,
    isLoading,
    error,
    toastMessage,
    currentSurah,
    currentReciter,
    playbackMode,
    sleepRemainingSeconds,
    volume,
    isPlaying,
    currentTime,
    duration,
    buffered,
    play,
    pause,
    seekTo,
    playNextSurah,
    playPreviousSurah,
    cyclePlaybackMode,
    cycleSleepTimer,
    setVolume,
    toggleMute,
    retry,
    closePlayer,
    dismissToast,
  } = usePlayer();

  const [sleepHint, setSleepHint] = useState<string | null>(null);
  const pendingNextPageRef = useRef(false);
  const sleepHintTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sleepHintTimeoutRef.current) {
        window.clearTimeout(sleepHintTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingNextPageRef.current || !currentSurah) {
      return;
    }

    pendingNextPageRef.current = false;
    router.push(`/${currentSurah.slug}`);
  }, [currentSurah, router]);

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

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }
    void play();
  }, [isPlaying, pause, play]);

  const sleepBadge = sleepRemainingSeconds ? `${Math.max(1, Math.ceil(sleepRemainingSeconds / 60))}m` : null;
  const isSleepWarning = sleepRemainingSeconds !== null && sleepRemainingSeconds <= 60;

  const handleSleepCycle = useCallback(() => {
    const nextMinutes = cycleSleepTimer();
    showSleepHint(nextMinutes);
  }, [cycleSleepTimer, showSleepHint]);

  const handleNextAndOpenPage = useCallback(async () => {
    pendingNextPageRef.current = true;
    await playNextSurah();
  }, [playNextSurah]);

  if (!currentSurah || !isVisible) {
    return null;
  }

  return (
    <>
      {toastMessage && (
        <div className="player-toast-wrap">
          <div className="player-toast-inner">
            <span>{toastMessage}</span>
            <button type="button" className="player-toast-dismiss" onClick={dismissToast}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="bottom-player">
        {error && (
          <div className="player-error-banner">
            <span>{error}</span>
            <button
              type="button"
              className="player-error-retry"
              onClick={() => {
                void retry();
              }}
            >
              Retry
            </button>
          </div>
        )}

        <div className="player-desktop">
          <div className="player-left">
            <div className="player-surah-number">{currentSurah.id}</div>
            <div className="player-surah-info">
              <Link href={surahPath} className="player-surah-title">
                <span className="player-surah-name">{currentSurah.transliteration}</span>
                <span className="player-surah-divider">·</span>
                <span className="player-surah-arabic">{currentSurah.name}</span>
              </Link>
              <span className="player-reciter-name">{currentReciter.name}</span>
            </div>
          </div>

          <div className="player-center">
            <div className="player-controls">
              <button
                type="button"
                className="player-ctrl-btn"
                aria-label="Previous surah"
                onClick={() => {
                  void playPreviousSurah();
                }}
              >
                <SkipBack size={15} />
              </button>
              <button type="button" className="player-play-btn" aria-label={isPlaying ? "Pause" : "Play"} onClick={togglePlayback}>
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                className="player-ctrl-btn"
                aria-label="Next surah"
                onClick={() => {
                  void handleNextAndOpenPage();
                }}
              >
                <SkipForward size={15} />
              </button>
            </div>
            <div className="player-seekbar-row">
              <span className="player-time">{formatTime(currentTime)}</span>
              <Seekbar currentTime={currentTime} duration={duration} buffered={buffered} onSeek={seekTo} />
              <span className="player-time player-duration">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="player-right">
            <ModeButton mode={playbackMode} onToggle={cyclePlaybackMode} />
            <div className="relative">
              {sleepHint && <span className="sleep-hint-tooltip player-tooltip player-tooltip-right">{sleepHint}</span>}
              <button
                type="button"
                className={`player-sleep-btn${sleepRemainingSeconds ? "player-sleep-active" : ""}${isSleepWarning ? "player-sleep-pulse" : ""}`}
                aria-label="Sleep timer"
                title="Sleep timer"
                onClick={handleSleepCycle}
              >
                <MoonStar size={16} />
                {sleepBadge && <span className="sleep-badge">{sleepBadge}</span>}
              </button>
            </div>
            <VolumeControl volume={volume} onVolumeChange={setVolume} onMuteToggle={toggleMute} />
            <ReciterSelect compact className="player-reciter-select" />
            <DownloadArchiveButton surah={currentSurah} />
            <button type="button" className="player-icon-plain" aria-label="Close player" title="Close player" onClick={closePlayer}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="player-mobile">
          <div className="player-mobile-row1">
            <Link href={surahPath} className="player-mobile-info player-surah-title">
              <span className="player-surah-name">{currentSurah.transliteration}</span>
              <span className="player-surah-divider">·</span>
              <span className="player-surah-arabic">{currentSurah.name}</span>
            </Link>
            <div className="player-mobile-actions">
              <button type="button" className="player-play-btn-sm" aria-label={isPlaying ? "Pause" : "Play"} onClick={togglePlayback}>
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                type="button"
                className="player-icon-plain"
                aria-label="Next surah"
                title="Next surah"
                onClick={() => {
                  void handleNextAndOpenPage();
                }}
              >
                <SkipForward size={16} />
              </button>
              <div className="relative">
                {sleepHint && <span className="sleep-hint-tooltip player-tooltip player-tooltip-right">{sleepHint}</span>}
                <button
                  type="button"
                  className={`player-sleep-btn${sleepRemainingSeconds ? "player-sleep-active" : ""}${isSleepWarning ? "player-sleep-pulse" : ""}`}
                  aria-label="Sleep timer"
                  title="Sleep timer"
                  onClick={handleSleepCycle}
                >
                  <MoonStar size={16} />
                  {sleepBadge && <span className="sleep-badge">{sleepBadge}</span>}
                </button>
              </div>
              <ModeButton mode={playbackMode} onToggle={cyclePlaybackMode} size={16} />
              <button type="button" className="player-icon-plain" aria-label="Close player" onClick={closePlayer}>
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="player-mobile-row2">
            <span className="player-time">{formatTime(currentTime)}</span>
            <Seekbar currentTime={currentTime} duration={duration} buffered={buffered} onSeek={seekTo} />
            <span className="player-time">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export const BottomPlayer = memo(BottomPlayerBase);
BottomPlayer.displayName = "BottomPlayer";
