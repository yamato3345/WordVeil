import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GlobalWordsSelection } from "./globalSelection/GlobalWordsSelection";
import "./WordSelection.scss";

export type SelectedWord = {
  text: string;
  x: number;
  y: number;
};

export function WordSelection() {
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: window.innerWidth - 260, y: 80 });

  const handleWordSelected = async (text: string, position?: { x: number; y: number }) => {
    const normalized = text.trim();
    console.log("[WordSelection] word captured:", normalized);

    try {
      await invoke("log_selected_word", {
        source: "frontend",
        word: normalized,
      });
    } catch (error) {
      console.error("[WordSelection] failed to log selected word in terminal", error);
    }

    const point = position ?? mousePosition;
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
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleFallbackShortcut = (event: KeyboardEvent) => {
      const isCtrlC = event.ctrlKey && (event.key === "c" || event.key === "C" || event.code === "KeyC");
      if (!isCtrlC) {
        return;
      }

      event.preventDefault();
      console.log("[WordSelection] Ctrl+C detected in window, clipboard capture will follow.");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleFallbackShortcut);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleFallbackShortcut);
    };
  }, []);

  return (
    <>
      <GlobalWordsSelection active={true} onWordSelected={handleWordSelected} />

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
