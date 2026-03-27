"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const isEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
};

export const GlobalSearchShortcut = () => {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isOpen]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || isEditableElement(event.target)) {
        return;
      }

      event.preventDefault();

      if (pathname === "/" || pathname === "/guides") {
        window.dispatchEvent(new Event("koko-focus-search"));
        return;
      }

      setIsOpen(true);
    };

    window.addEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [pathname]);

  const closeModal = () => {
    setIsOpen(false);
    setQuery("");
  };

  const submitQuery = () => {
    const trimmed = query.trim();
    const path = trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/";

    router.push(path);
    closeModal();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black-a8 px-4 pt-24" role="dialog" aria-modal="true" aria-label="Search Surahs">
      <div className="w-full max-w-screen-sm rounded-large border border-border bg-background p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-muted" size={14} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search surah and jump to list"
            className="h-11 w-full rounded-base border border-border bg-background pr-11 pl-9 outline-none transition-colors placeholder:text-muted focus:border-gray-7"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitQuery();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                closeModal();
              }
            }}
          />
          <button
            type="button"
            className="absolute top-1/2 right-0.5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-base text-muted transition-colors hover:bg-gray-a2 hover:text-foreground"
            aria-label="Close search"
            onClick={closeModal}
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="h-11 rounded-base border border-border px-3 text-small transition-colors hover:bg-gray-a2" onClick={closeModal}>
            Cancel
          </button>
          <button type="button" className="h-11 rounded-base border border-border px-3 text-small transition-colors hover:bg-gray-a2" onClick={submitQuery}>
            Search
          </button>
        </div>
      </div>
    </div>
  );
};
