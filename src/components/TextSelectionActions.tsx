"use client";

import { Copy } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface SelectionActionsState {
  isVisible: boolean;
  top: number;
  left: number;
  text: string;
}

const popupWidth = 112;

const getSelectionElement = (node: Node | null) => {
  if (!node) {
    return null;
  }

  return node.nodeType === Node.TEXT_NODE ? node.parentElement : node instanceof Element ? node : null;
};

const isIgnoredSelection = (element: Element | null) =>
  Boolean(element?.closest("input, textarea, select, button, [contenteditable='true'], [role='dialog'], [data-selection-actions-ignore='true']"));

export const TextSelectionActions = () => {
  const pathname = usePathname();
  const toastTimerRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectionActions, setSelectionActions] = useState<SelectionActionsState>({
    isVisible: false,
    top: 0,
    left: 0,
    text: "",
  });

  const showCopiedToast = useCallback(() => {
    setCopied(true);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      toastTimerRef.current = null;
    }, 1500);
  }, []);

  const hideSelectionActions = useCallback(() => {
    setSelectionActions((current) => {
      if (!current.isVisible) {
        return current;
      }

      return {
        ...current,
        isVisible: false,
      };
    });
  }, []);

  const updateSelectionActions = useCallback(() => {
    const selection = window.getSelection();
    const pageRoot = document.getElementById("page-top");

    if (!selection || !pageRoot || selection.rangeCount === 0 || selection.isCollapsed) {
      hideSelectionActions();
      return;
    }

    const text = selection.toString().trim();

    if (!text) {
      hideSelectionActions();
      return;
    }

    const range = selection.getRangeAt(0);
    const selectionElement = getSelectionElement(range.commonAncestorContainer);

    if (!selectionElement || !pageRoot.contains(selectionElement) || isIgnoredSelection(selectionElement)) {
      hideSelectionActions();
      return;
    }

    const rect = range.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      hideSelectionActions();
      return;
    }

    const left = Math.min(Math.max(rect.left + rect.width / 2 - popupWidth / 2, 12), window.innerWidth - popupWidth - 12);
    const top = rect.top > 72 ? rect.top - 54 : rect.bottom + 12;

    setSelectionActions({
      isVisible: true,
      top,
      left,
      text,
    });
  }, [hideSelectionActions]);

  const copySelectedText = useCallback(async () => {
    const selectedText = selectionActions.text.trim() || window.getSelection()?.toString().trim() || "";

    if (!selectedText) {
      return;
    }

    await navigator.clipboard.writeText(selectedText);
    window.getSelection()?.removeAllRanges();
    hideSelectionActions();
    showCopiedToast();
  }, [hideSelectionActions, selectionActions.text, showCopiedToast]);

  useEffect(() => {
    const onSelectionChange = () => {
      updateSelectionActions();
    };

    const onViewportChange = () => {
      hideSelectionActions();
    };

    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);

    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [hideSelectionActions, updateSelectionActions]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    hideSelectionActions();
    window.getSelection()?.removeAllRanges();
  }, [hideSelectionActions, pathname]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {copied && <div className="fixed right-6 bottom-28 z-50 rounded-base border border-border bg-background px-3 py-2 text-small">Copied!</div>}

      {selectionActions.isVisible && (
        <div
          className="fixed z-50"
          style={{
            top: `${selectionActions.top}px`,
            left: `${selectionActions.left}px`,
          }}
        >
          <div className="flex items-center gap-1 rounded-[14px] border border-border bg-background/95 p-1 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-md">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-base px-2.5 text-[12px] text-muted transition-colors hover:bg-gray-a2 hover:text-foreground"
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                void copySelectedText();
              }}
            >
              <Copy size={12} />
              <span>Copy</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
