export const keyboardShortcutEvents = {
  openSearch: "koko-open-search",
  copySurahText: "koko-copy-surah-text",
  toggleHighlight: "koko-toggle-highlight",
  playCurrentSurah: "koko-play-current-surah",
  goPreviousSurahPage: "koko-go-previous-surah-page",
  goNextSurahPage: "koko-go-next-surah-page",
} as const;

export const isEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
};

export const isDesktopKeyboardEnvironment = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(min-width: 768px)").matches && window.matchMedia("(hover: hover)").matches && !window.matchMedia("(pointer: coarse)").matches;
};

export const hasOpenModal = () => {
  if (typeof document === "undefined") {
    return false;
  }

  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
};
