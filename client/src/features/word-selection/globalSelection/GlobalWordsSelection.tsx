import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

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
      debug("global selection disabled");
      return;
    }

    const handleCopyShortcut = (event: KeyboardEvent) => {
      const isCtrlC = event.ctrlKey && (event.key === "c" || event.key === "C" || event.code === "KeyC");
      if (!isCtrlC) {
        return;
      }

      debug("Ctrl+C pressed");
      window.setTimeout(() => {
        void readClipboardWord();
      }, 80);
    };

    window.addEventListener("keydown", handleCopyShortcut);
    debug("global selection listener attached");

    const intervalId = window.setInterval(() => {
      debug("global poll tick");
      void readClipboardWord();
    }, 1200);

    return () => {
      window.removeEventListener("keydown", handleCopyShortcut);
      window.clearInterval(intervalId);
      debug("global selection listener removed");
    };
  }, [active]);

  return null;
}
