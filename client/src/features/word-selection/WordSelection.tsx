import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { GlobalWordsSelection } from "./globalSelection/GlobalWordsSelection";
import "./WordSelection.scss";

export type SelectedWord = {
  text: string;
  x: number;
  y: number;
};

export function WordSelection({ active = true }: { active?: boolean }) {
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const captureInProgressRef = useRef(false);
  const mousePositionRef = useRef({ x: window.innerWidth - 260, y: 80 });

  const handleWordSelected = async (text: string, position?: { x: number; y: number }) => {
    const normalized = text.trim();
    if (!normalized) {
      console.log("[WordSelection] empty word ignored");
      return;
    }

    console.log("[WordSelection] word captured:", normalized);

    try {
      await invoke("log_selected_word", {
        source: "frontend",
        word: normalized,
      });
    } catch (error) {
      console.error("[WordSelection] failed to log selected word in terminal", error);
    }

    const point = position ?? mousePositionRef.current;
    const x = Math.min(Math.max(point.x + 18, 18), window.innerWidth - 220);
    const y = Math.max(point.y - 30, 18);

    setSelectedWord(null);

    try {
      await invoke("show_word_overlay", {
        word: normalized,
        x,
        y,
      });
    } catch (error) {
      console.error("[WordSelection] failed to show floating word overlay", error);
      setSelectedWord({
        text: normalized,
        x,
        y,
      });
    }
  };

  useEffect(() => {
    if (!active) {
      setSelectedWord(null);
      void invoke("close_word_overlay").catch(console.error);
      return;
    }
    let disposed = false;
    let unlisten: (() => void) | undefined;
    const capture = async () => {
      if (captureInProgressRef.current) return;
      captureInProgressRef.current = true;
      try {
        const text = await invoke<string>("capture_selected_text");
        if (!disposed && text.trim()) await handleWordSelected(text);
      } catch (error) {
        console.error("[WordSelection] screen selection failed", error);
      } finally {
        captureInProgressRef.current = false;
      }
    };
    void listen("shortcut-triggered", () => void capture()).then((stop) => {
      if (disposed) stop();
      else unlisten = stop;
    }).catch((error) => console.error("[WordSelection] shortcut listener failed", error));
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [active]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleFallbackShortcut = (event: KeyboardEvent) => {
      const isCtrlC = event.ctrlKey && (event.key === "c" || event.key === "C" || event.code === "KeyC");
      if (!isCtrlC) {
        return;
      }

      console.log("[WordSelection] Ctrl+C detected in window, clipboard capture will follow.");
    };

    const handleEscapeClose = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      void invoke("close_word_overlay");
    };

    const handleMouseDownClose = () => {
      void invoke("close_word_overlay");
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("keydown", handleFallbackShortcut);
    window.addEventListener("keydown", handleEscapeClose);
    window.addEventListener("mousedown", handleMouseDownClose, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleFallbackShortcut);
      window.removeEventListener("keydown", handleEscapeClose);
      window.removeEventListener("mousedown", handleMouseDownClose);
    };
  }, []);

  return (
    <>
      <GlobalWordsSelection active={active} onWordSelected={handleWordSelected} />

      {selectedWord && (
        <div
          className="word-selection__panel"
          style={{ left: selectedWord.x, top: selectedWord.y }}
          aria-live="polite"
        >
          <span className="word-selection__label">Selected word</span>
          <strong className="word-selection__value">{selectedWord.text}</strong>
        </div>
      )}
    </>
  );
}
