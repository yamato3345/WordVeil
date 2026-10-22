import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  CLIPBOARD_CAPTURE_COOLDOWN_MS,
  CLIPBOARD_CTRL_C_READ_DELAY_MS,
  CLIPBOARD_POLL_INTERVAL_MS,
} from "./overlay/clipboardConfig";

const normalizeWord = (value: string) => {
  const cleaned = value
    .replace(/[\s\u2000-\u206F\u2E00-\u2E7F\\'"“”‘’.,!?;:()\[\]{}<>/|+=_~`@#$%^&*]/g, "")
    .trim();

  return cleaned;
};

const extractFirstWord = (value: string) => {
  const parts = value
    .split(/\s+/)
    .map((part) => normalizeWord(part))
    .filter(Boolean);

  return parts[0] ?? "";
};

type GlobalWordsSelectionProps = {
  active: boolean;
  onWordSelected: (text: string) => void;
};

export function GlobalWordsSelection({ active, onWordSelected }: GlobalWordsSelectionProps) {
  const lastClipboardRawRef = useRef("");
  const isPollingClipboardRef = useRef(false);
  const lastCaptureAtRef = useRef(0);
  const baselineReadyRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const shortcutTimeoutRef = useRef<number | null>(null);

  const debug = (message: string, detail?: unknown) => {
    const stamp = new Date().toLocaleTimeString();
    if (typeof detail === "undefined") {
      console.log(`[globalSelection][${stamp}] ${message}`);
      return;
    }

    console.log(`[globalSelection][${stamp}] ${message}`, detail);
  };

  const handleClipboardValue = async (raw: string) => {
    const trimmed = raw.trim();
    debug("clipboard raw value received", trimmed);

    if (!baselineReadyRef.current) {
      lastClipboardRawRef.current = trimmed;
      baselineReadyRef.current = true;
      debug("clipboard baseline initialized");
      return;
    }

    const now = Date.now();
    if (now - lastCaptureAtRef.current < CLIPBOARD_CAPTURE_COOLDOWN_MS) {
      debug("clipboard value ignored: cooldown active");
      return;
    }

    if (!trimmed || trimmed === lastClipboardRawRef.current) {
      debug("clipboard value ignored: empty or unchanged");
      return;
    }

    lastClipboardRawRef.current = trimmed;

    const text = extractFirstWord(trimmed);
    debug("first word extracted from clipboard", text);

    if (!text) {
      debug("no valid word found in clipboard value");
      return;
    }

    lastCaptureAtRef.current = now;
    try {
      await invoke("log_selected_word", {
        source: "globalSelection",
        word: text,
      });
    } catch (error) {
      debug("failed to log selected word via backend", error);
    }

    debug("selected word from clipboard", text);
    onWordSelected(text);
  };

  const readClipboardWord = async () => {
    if (isPollingClipboardRef.current) {
      debug("clipboard read skipped: already in progress");
      return;
    }

    isPollingClipboardRef.current = true;
    debug("reading clipboard");

    try {
      const raw = (await invoke<string>("read_clipboard_word")) ?? "";
      debug("clipboard command returned", raw);
      await handleClipboardValue(raw);
    } catch (error) {
      debug("clipboard read failed", error);
    } finally {
      isPollingClipboardRef.current = false;
    }
  };

  useEffect(() => {
    if (!active) {
      lastClipboardRawRef.current = "";
      baselineReadyRef.current = false;
      debug("global selection disabled");
      return;
    }

    const handleCopyShortcut = (event: KeyboardEvent) => {
      const isCtrlC = event.ctrlKey && (event.key === "c" || event.key === "C" || event.code === "KeyC");
      if (!isCtrlC) {
        return;
      }

      debug("Ctrl+C pressed");
      if (shortcutTimeoutRef.current) {
        window.clearTimeout(shortcutTimeoutRef.current);
      }

      shortcutTimeoutRef.current = window.setTimeout(() => {
        void readClipboardWord();
      }, CLIPBOARD_CTRL_C_READ_DELAY_MS);
    };

    window.addEventListener("keydown", handleCopyShortcut);
    debug("global selection listeners attached");

    // Build a baseline from current clipboard so app start does not trigger popup.
    void readClipboardWord();

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      void readClipboardWord();
    }, CLIPBOARD_POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("keydown", handleCopyShortcut);
      if (shortcutTimeoutRef.current) {
        window.clearTimeout(shortcutTimeoutRef.current);
        shortcutTimeoutRef.current = null;
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      debug("global selection listeners removed");
    };
  }, [active]);

  return null;
}
