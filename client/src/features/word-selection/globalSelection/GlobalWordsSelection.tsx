import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import {
  CLIPBOARD_CTRL_C_READ_DELAY_MS,
  CLIPBOARD_POLL_INTERVAL_MS,
} from "./overlay/clipboardConfig";
import { extractClipboardWord } from "./clipboardWord";

type GlobalWordsSelectionProps = {
  active: boolean;
  onWordSelected: (text: string) => void;
};

export function GlobalWordsSelection({ active, onWordSelected }: GlobalWordsSelectionProps) {
  const callbackRef = useRef(onWordSelected);
  callbackRef.current = onWordSelected;

  useEffect(() => {
    if (!active) return;

    let disposed = false;
    let stopWatching: (() => void) | undefined;
    let watching = false;
    let baseline: string | undefined;
    let reading = false;
    let pendingCopy = false;
    let pollTimer: number | undefined;
    let copyTimer: number | undefined;

    const read = async (explicitCopy = false) => {
      if (disposed) return;
      if (reading) {
        pendingCopy ||= explicitCopy;
        return;
      }
      reading = true;
      try {
        const raw = await invoke<string>("read_clipboard_word");
        if (disposed) return;
        const previous = baseline;
        baseline = raw;
        // The first successful read establishes a baseline without a startup popup.
        if (!explicitCopy && watching) return;
        if (!explicitCopy && (previous === undefined || raw === previous)) return;
        const word = extractClipboardWord(raw);
        if (!word) return;
        callbackRef.current(word);
      } catch {
        // An empty, non-text, unavailable or timed-out clipboard is normal.
      } finally {
        reading = false;
        if (!disposed && pendingCopy) {
          pendingCopy = false;
          void read(true);
        }
      }
    };

    const poll = async () => {
      await read();
      if (!disposed) pollTimer = window.setTimeout(poll, CLIPBOARD_POLL_INTERVAL_MS);
    };
    const handleCopy = () => {
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => void read(true), CLIPBOARD_CTRL_C_READ_DELAY_MS);
    };

    // A copy event also handles menu Copy and repeated copying of the same word.
    window.addEventListener("copy", handleCopy);
    void listen("clipboard-copy", () => {
      watching = true;
      handleCopy();
    }).then((stop) => {
      if (disposed) stop();
      else stopWatching = stop;
    }).catch(() => {});
    void poll();
    return () => {
      disposed = true;
      stopWatching?.();
      window.clearTimeout(pollTimer);
      window.clearTimeout(copyTimer);
      window.removeEventListener("copy", handleCopy);
    };
  }, [active]);

  return null;
}
