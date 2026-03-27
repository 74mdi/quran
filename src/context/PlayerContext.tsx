"use client";

import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Reciter } from "@/src/data/reciters";

import { defaultReciterId, getReciterById } from "@/src/data/reciters";
import type { SurahMeta } from "@/src/types/quran";

export type PlaybackMode = "normal" | "repeat" | "auto-next";

interface PersistedPlayerState {
  surahId: number;
  reciterId: string;
  currentTime: number;
  volume: number;
  playbackMode: PlaybackMode;
  highlightAyah: boolean;
  sleepMinutes: number | null;
}

interface PlayerTimingValue {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  currentAyah: number | null;
}

interface PlayerStateValue {
  isVisible: boolean;
  isLoading: boolean;
  error: string | null;
  toastMessage: string | null;
  currentSurahId: number | null;
  currentSurah: SurahMeta | null;
  currentReciterId: string;
  currentReciter: Reciter;
  audioUrl: string | null;
  playbackMode: PlaybackMode;
  highlightAyah: boolean;
  sleepRemainingSeconds: number | null;
  volume: number;
}

interface PlayerActionsValue {
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (timeInSeconds: number) => void;
  playSurah: (surahId: number, reciterId?: string) => Promise<void>;
  playNextSurah: () => Promise<void>;
  playPreviousSurah: () => Promise<void>;
  setReciter: (reciterId: string) => Promise<void>;
  setVolume: (nextVolume: number) => void;
  toggleMute: () => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  cyclePlaybackMode: () => PlaybackMode;
  setSleepMinutes: (minutes: number | null) => void;
  cycleSleepTimer: () => number | null;
  setHighlightAyah: (enabled: boolean) => void;
  toggleHighlightAyah: () => void;
  retry: () => Promise<void>;
  closePlayer: () => void;
  dismissToast: () => void;
}

const PlayerActionsContext = createContext<PlayerActionsValue | null>(null);
const PlayerStateContext = createContext<PlayerStateValue | null>(null);
const PlayerTimingContext = createContext<PlayerTimingValue | null>(null);

interface PlayerProviderProps {
  children: React.ReactNode;
  surahs: SurahMeta[];
}

const PLAYER_STORAGE_KEY = "koko-player-state";
const sleepCycleOptions: Array<number | null> = [null, 15, 30, 45, 60];

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const isPlaybackMode = (value: unknown): value is PlaybackMode => {
  return value === "normal" || value === "repeat" || value === "auto-next";
};

export const PlayerProvider = ({ children, surahs }: PlayerProviderProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentSurahId, setCurrentSurahId] = useState<number | null>(null);
  const [currentReciterId, setCurrentReciterId] = useState(defaultReciterId);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);

  const [playbackMode, setPlaybackModeState] = useState<PlaybackMode>("normal");
  const [highlightAyah, setHighlightAyahState] = useState(true);
  const [volume, setVolumeState] = useState(1);
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);
  const [sleepPresetMinutes, setSleepPresetMinutes] = useState<number | null>(null);

  const currentSurahIdRef = useRef<number | null>(null);
  const currentReciterIdRef = useRef(defaultReciterId);
  const currentTimeRef = useRef(0);
  const playbackModeRef = useRef<PlaybackMode>("normal");
  const highlightAyahRef = useRef(true);
  const volumeRef = useRef(1);
  const sleepRemainingSecondsRef = useRef<number | null>(null);

  const pendingSeekRef = useRef<number | null>(null);
  const sleepDeadlineRef = useRef<number | null>(null);
  const previousVolumeRef = useRef(1);
  const lastSavedAtRef = useRef(0);
  const restoredStateRef = useRef(false);
  const toastTimeoutRef = useRef<number | null>(null);

  const surahMap = useMemo(() => {
    return new Map(surahs.map((surah) => [surah.id, surah]));
  }, [surahs]);

  const currentSurah = currentSurahId ? (surahMap.get(currentSurahId) ?? null) : null;
  const currentReciter = useMemo(() => getReciterById(currentReciterId), [currentReciterId]);
  const audioUrl = currentSurahId ? getReciterById(currentReciterId).getAudioUrl(currentSurahId) : null;

  useEffect(() => {
    currentSurahIdRef.current = currentSurahId;
  }, [currentSurahId]);

  useEffect(() => {
    currentReciterIdRef.current = currentReciterId;
  }, [currentReciterId]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  useEffect(() => {
    highlightAyahRef.current = highlightAyah;
  }, [highlightAyah]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    sleepRemainingSecondsRef.current = sleepRemainingSeconds;
  }, [sleepRemainingSeconds]);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    if (typeof window === "undefined") {
      return;
    }

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const persistPlayerState = useCallback((force = false) => {
    if (typeof window === "undefined") {
      return;
    }

    const now = Date.now();

    if (!force && now - lastSavedAtRef.current < 5000) {
      return;
    }

    const surahId = currentSurahIdRef.current;

    if (!surahId) {
      return;
    }

    const audio = audioRef.current;
    const sleepMinutes =
      sleepRemainingSecondsRef.current && sleepRemainingSecondsRef.current > 0 ? Math.max(1, Math.ceil(sleepRemainingSecondsRef.current / 60)) : null;

    const snapshot: PersistedPlayerState = {
      surahId,
      reciterId: currentReciterIdRef.current,
      currentTime: clamp(audio?.currentTime ?? currentTimeRef.current, 0, 24 * 60 * 60),
      volume: clamp(volumeRef.current, 0, 1),
      playbackMode: playbackModeRef.current,
      highlightAyah: highlightAyahRef.current,
      sleepMinutes,
    };

    try {
      window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(snapshot));
      lastSavedAtRef.current = now;
    } catch {
      // Ignore private mode / disabled storage failures.
    }
  }, []);

  const loadSource = useCallback((surahId: number, reciterId: string) => {
    const audio = audioRef.current;

    if (!audio) {
      return null;
    }

    const reciter = getReciterById(reciterId);
    const url = reciter.getAudioUrl(surahId);

    if (audio.src !== url) {
      audio.src = url;
    }

    audio.preload = "none";
    audio.load();

    return {
      reciterId: reciter.id,
      url,
    };
  }, []);

  const attemptPlay = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await audio.play();
    } catch {
      setIsLoading(false);
      setIsPlaying(false);
      setError("Could not load audio, try another reciter");
    }
  }, []);

  const playSurah = useCallback(
    async (surahId: number, reciterId = currentReciterIdRef.current) => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      const reciter = getReciterById(reciterId);
      const targetUrl = reciter.getAudioUrl(surahId);
      const sameTrack = currentSurahIdRef.current === surahId && currentReciterIdRef.current === reciter.id && audio.src === targetUrl;

      setIsVisible(true);

      if (sameTrack) {
        if (audio.paused) {
          await attemptPlay();
        } else {
          audio.pause();
        }

        return;
      }

      setCurrentSurahId(surahId);
      setCurrentReciterId(reciter.id);
      currentSurahIdRef.current = surahId;
      currentReciterIdRef.current = reciter.id;

      setCurrentTime(0);
      currentTimeRef.current = 0;
      setDuration(0);
      setBuffered(0);
      setCurrentAyah(null);
      pendingSeekRef.current = null;

      setError(null);
      loadSource(surahId, reciter.id);

      await attemptPlay();
      persistPlayerState(true);
    },
    [attemptPlay, loadSource, persistPlayerState],
  );

  const play = useCallback(async () => {
    if (!currentSurahIdRef.current) {
      await playSurah(1, currentReciterIdRef.current);
      return;
    }

    await attemptPlay();
  }, [attemptPlay, playSurah]);

  const pause = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
  }, []);

  const seekTo = useCallback(
    (timeInSeconds: number) => {
      const audio = audioRef.current;

      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }

      const safeTime = clamp(timeInSeconds, 0, audio.duration);
      audio.currentTime = safeTime;

      setCurrentTime(safeTime);
      currentTimeRef.current = safeTime;
      persistPlayerState(true);
    },
    [persistPlayerState],
  );

  const playNextSurah = useCallback(async () => {
    const nextSurahId = currentSurahIdRef.current ? (currentSurahIdRef.current === 114 ? 1 : currentSurahIdRef.current + 1) : 1;
    await playSurah(nextSurahId, currentReciterIdRef.current);
  }, [playSurah]);

  const playPreviousSurah = useCallback(async () => {
    const previousSurahId = currentSurahIdRef.current ? (currentSurahIdRef.current === 1 ? 114 : currentSurahIdRef.current - 1) : 114;
    await playSurah(previousSurahId, currentReciterIdRef.current);
  }, [playSurah]);

  const setReciter = useCallback(
    async (reciterId: string) => {
      const reciter = getReciterById(reciterId);

      if (reciter.id === currentReciterIdRef.current) {
        return;
      }

      setCurrentReciterId(reciter.id);
      currentReciterIdRef.current = reciter.id;

      if (!currentSurahIdRef.current) {
        persistPlayerState(true);
        return;
      }

      setCurrentTime(0);
      currentTimeRef.current = 0;
      setDuration(0);
      setBuffered(0);
      setCurrentAyah(null);
      pendingSeekRef.current = null;

      loadSource(currentSurahIdRef.current, reciter.id);
      await attemptPlay();
      persistPlayerState(true);
    },
    [attemptPlay, loadSource, persistPlayerState],
  );

  const setVolume = useCallback(
    (nextVolume: number) => {
      const safeVolume = clamp(nextVolume, 0, 1);
      const audio = audioRef.current;

      setVolumeState(safeVolume);
      volumeRef.current = safeVolume;

      if (safeVolume > 0) {
        previousVolumeRef.current = safeVolume;
      }

      if (audio) {
        audio.volume = safeVolume;
      }

      persistPlayerState(true);
    },
    [persistPlayerState],
  );

  const toggleMute = useCallback(() => {
    if (volumeRef.current <= 0) {
      setVolume(previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.7);
      return;
    }

    previousVolumeRef.current = volumeRef.current;
    setVolume(0);
  }, [setVolume]);

  const setPlaybackMode = useCallback(
    (mode: PlaybackMode) => {
      setPlaybackModeState(mode);
      playbackModeRef.current = mode;
      persistPlayerState(true);
    },
    [persistPlayerState],
  );

  const cyclePlaybackMode = useCallback(() => {
    const nextMode: PlaybackMode = playbackModeRef.current === "normal" ? "repeat" : playbackModeRef.current === "repeat" ? "auto-next" : "normal";

    setPlaybackModeState(nextMode);
    playbackModeRef.current = nextMode;
    persistPlayerState(true);

    return nextMode;
  }, [persistPlayerState]);

  const setHighlightAyah = useCallback(
    (enabled: boolean) => {
      setHighlightAyahState(enabled);
      highlightAyahRef.current = enabled;
      persistPlayerState(true);
    },
    [persistPlayerState],
  );

  const toggleHighlightAyah = useCallback(() => {
    const nextValue = !highlightAyahRef.current;
    setHighlightAyah(nextValue);
  }, [setHighlightAyah]);

  const setSleepMinutes = useCallback(
    (minutes: number | null) => {
      if (!minutes || minutes <= 0) {
        sleepDeadlineRef.current = null;
        sleepRemainingSecondsRef.current = null;
        setSleepRemainingSeconds(null);
        setSleepPresetMinutes(null);
        persistPlayerState(true);
        return;
      }

      const safeMinutes = Math.max(1, Math.round(minutes));
      const seconds = safeMinutes * 60;

      sleepDeadlineRef.current = Date.now() + seconds * 1000;
      sleepRemainingSecondsRef.current = seconds;
      setSleepRemainingSeconds(seconds);
      setSleepPresetMinutes(safeMinutes);
      persistPlayerState(true);
    },
    [persistPlayerState],
  );

  const cycleSleepTimer = useCallback(() => {
    const currentIndex = sleepCycleOptions.indexOf(sleepPresetMinutes);
    const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextMinutes = sleepCycleOptions[(normalizedIndex + 1) % sleepCycleOptions.length];

    setSleepMinutes(nextMinutes);

    return nextMinutes;
  }, [setSleepMinutes, sleepPresetMinutes]);

  const retry = useCallback(async () => {
    if (!currentSurahIdRef.current) {
      return;
    }

    await playSurah(currentSurahIdRef.current, currentReciterIdRef.current);
  }, [playSurah]);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    setIsVisible(false);
    setIsLoading(false);
    setError(null);
    persistPlayerState(true);
  }, [persistPlayerState]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = clamp(volumeRef.current, 0, 1);

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
    };

    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
      persistPlayerState(true);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onDurationChange = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(nextDuration);

      if (pendingSeekRef.current !== null && nextDuration > 0) {
        const safeTime = clamp(pendingSeekRef.current, 0, nextDuration);
        audio.currentTime = safeTime;
        setCurrentTime(safeTime);
        currentTimeRef.current = safeTime;
        pendingSeekRef.current = null;
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      currentTimeRef.current = audio.currentTime;
      persistPlayerState(false);
    };

    const onProgress = () => {
      if (audio.buffered.length === 0) {
        return;
      }

      const nextBuffered = clamp(audio.buffered.end(audio.buffered.length - 1), 0, Number.isFinite(audio.duration) ? audio.duration : Number.MAX_SAFE_INTEGER);
      setBuffered(nextBuffered);
    };

    const onVolumeChange = () => {
      const nextVolume = clamp(audio.volume, 0, 1);

      if (nextVolume !== volumeRef.current) {
        setVolumeState(nextVolume);
        volumeRef.current = nextVolume;

        if (nextVolume > 0) {
          previousVolumeRef.current = nextVolume;
        }
      }
    };

    const onEnded = () => {
      persistPlayerState(true);

      if (playbackModeRef.current === "repeat") {
        audio.currentTime = 0;
        void attemptPlay();
        return;
      }

      if (playbackModeRef.current === "auto-next") {
        const nextSurahId = currentSurahIdRef.current ? (currentSurahIdRef.current === 114 ? 1 : currentSurahIdRef.current + 1) : 1;
        void playSurah(nextSurahId, currentReciterIdRef.current);
      }
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError("Could not load audio, try another reciter");
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("playing", onCanPlay);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("progress", onProgress);
    audio.addEventListener("volumechange", onVolumeChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("playing", onCanPlay);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("progress", onProgress);
      audio.removeEventListener("volumechange", onVolumeChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [attemptPlay, persistPlayerState, playSurah]);

  useEffect(() => {
    if (!currentSurahId || duration <= 0) {
      setCurrentAyah((previous) => (previous === null ? previous : null));
      return;
    }

    const surah = surahMap.get(currentSurahId);

    if (!surah) {
      setCurrentAyah((previous) => (previous === null ? previous : null));
      return;
    }

    const segmentDuration = duration / surah.ayahCount;
    const nextAyah = clamp(Math.floor(currentTime / segmentDuration) + 1, 1, surah.ayahCount);

    setCurrentAyah((previous) => {
      return previous === nextAyah ? previous : nextAyah;
    });
  }, [currentSurahId, currentTime, duration, surahMap]);

  useEffect(() => {
    if (sleepDeadlineRef.current === null) {
      return;
    }

    const interval = window.setInterval(() => {
      if (sleepDeadlineRef.current === null) {
        return;
      }

      const remaining = Math.max(0, Math.ceil((sleepDeadlineRef.current - Date.now()) / 1000));

      sleepRemainingSecondsRef.current = remaining > 0 ? remaining : null;
      setSleepRemainingSeconds(remaining > 0 ? remaining : null);

      if (remaining <= 0) {
        sleepDeadlineRef.current = null;
        setSleepPresetMinutes(null);

        const audio = audioRef.current;

        if (audio) {
          audio.pause();
        }

        showToast("Sleep timer ended");
        persistPlayerState(true);
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [persistPlayerState, showToast]);

  useEffect(() => {
    if (typeof window === "undefined" || restoredStateRef.current) {
      return;
    }

    restoredStateRef.current = true;

    try {
      const rawState = window.localStorage.getItem(PLAYER_STORAGE_KEY);

      if (!rawState) {
        return;
      }

      const parsed = JSON.parse(rawState) as Partial<PersistedPlayerState>;
      const parsedSurahId = Number(parsed.surahId);
      const validSurahId = Number.isInteger(parsedSurahId) && parsedSurahId >= 1 && parsedSurahId <= 114 ? parsedSurahId : null;

      const reciter = getReciterById(typeof parsed.reciterId === "string" ? parsed.reciterId : defaultReciterId);
      const savedVolume = typeof parsed.volume === "number" ? clamp(parsed.volume, 0, 1) : 1;
      const savedMode = isPlaybackMode(parsed.playbackMode) ? parsed.playbackMode : "normal";
      const savedHighlightAyah = typeof parsed.highlightAyah === "boolean" ? parsed.highlightAyah : true;
      const savedTime = typeof parsed.currentTime === "number" ? Math.max(0, parsed.currentTime) : 0;

      setCurrentReciterId(reciter.id);
      currentReciterIdRef.current = reciter.id;

      setPlaybackModeState(savedMode);
      playbackModeRef.current = savedMode;

      setHighlightAyahState(savedHighlightAyah);
      highlightAyahRef.current = savedHighlightAyah;

      setVolumeState(savedVolume);
      volumeRef.current = savedVolume;

      if (savedVolume > 0) {
        previousVolumeRef.current = savedVolume;
      }

      if (typeof parsed.sleepMinutes === "number" && parsed.sleepMinutes > 0) {
        setSleepMinutes(parsed.sleepMinutes);
      }

      if (!validSurahId) {
        return;
      }

      setCurrentSurahId(validSurahId);
      currentSurahIdRef.current = validSurahId;
      setIsVisible(true);
      setCurrentTime(savedTime);
      currentTimeRef.current = savedTime;
      setDuration(0);
      setBuffered(0);
      setCurrentAyah(null);

      pendingSeekRef.current = savedTime;

      loadSource(validSurahId, reciter.id);
    } catch {
      // Ignore malformed / inaccessible storage.
    }
  }, [loadSource, setSleepMinutes]);

  useEffect(() => {
    const onBeforeUnload = () => {
      persistPlayerState(true);
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [persistPlayerState]);

  const actionsValue = useMemo<PlayerActionsValue>(
    () => ({
      play,
      pause,
      seekTo,
      playSurah,
      playNextSurah,
      playPreviousSurah,
      setReciter,
      setVolume,
      toggleMute,
      setPlaybackMode,
      cyclePlaybackMode,
      setSleepMinutes,
      cycleSleepTimer,
      setHighlightAyah,
      toggleHighlightAyah,
      retry,
      closePlayer,
      dismissToast,
    }),
    [
      closePlayer,
      cyclePlaybackMode,
      cycleSleepTimer,
      dismissToast,
      pause,
      play,
      playNextSurah,
      playPreviousSurah,
      playSurah,
      retry,
      seekTo,
      setHighlightAyah,
      setPlaybackMode,
      setReciter,
      setSleepMinutes,
      setVolume,
      toggleHighlightAyah,
      toggleMute,
    ],
  );

  const stateValue = useMemo<PlayerStateValue>(
    () => ({
      isVisible,
      isLoading,
      error,
      toastMessage,
      currentSurahId,
      currentSurah,
      currentReciterId,
      currentReciter,
      audioUrl,
      playbackMode,
      highlightAyah,
      sleepRemainingSeconds,
      volume,
    }),
    [
      audioUrl,
      currentReciter,
      currentReciterId,
      currentSurah,
      currentSurahId,
      error,
      highlightAyah,
      isLoading,
      isVisible,
      playbackMode,
      sleepRemainingSeconds,
      toastMessage,
      volume,
    ],
  );

  const timingValue = useMemo<PlayerTimingValue>(
    () => ({
      isPlaying,
      currentTime,
      duration,
      buffered,
      currentAyah,
    }),
    [buffered, currentAyah, currentTime, duration, isPlaying],
  );

  return (
    <PlayerActionsContext.Provider value={actionsValue}>
      <PlayerStateContext.Provider value={stateValue}>
        <PlayerTimingContext.Provider value={timingValue}>
          {children}
          <audio ref={audioRef} preload="none" />
        </PlayerTimingContext.Provider>
      </PlayerStateContext.Provider>
    </PlayerActionsContext.Provider>
  );
};

const usePlayerActionsContext = () => {
  const context = useContext(PlayerActionsContext);

  if (!context) {
    throw new Error("usePlayerActions must be used within PlayerProvider");
  }

  return context;
};

const usePlayerStateContext = () => {
  const context = useContext(PlayerStateContext);

  if (!context) {
    throw new Error("usePlayerState must be used within PlayerProvider");
  }

  return context;
};

const usePlayerTimingContext = () => {
  const context = useContext(PlayerTimingContext);

  if (!context) {
    throw new Error("usePlayerTiming must be used within PlayerProvider");
  }

  return context;
};

export const usePlayerActions = () => usePlayerActionsContext();
export const usePlayerState = () => usePlayerStateContext();
export const usePlayerTiming = () => usePlayerTimingContext();

export const usePlayer = () => {
  return {
    ...usePlayerStateContext(),
    ...usePlayerTimingContext(),
    ...usePlayerActionsContext(),
  };
};
