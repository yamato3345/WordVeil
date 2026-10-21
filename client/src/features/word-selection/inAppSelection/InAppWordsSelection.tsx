import { useEffect, useRef, useState } from "react";

const normalizeWord = (value: string) => {
  const cleaned = value
    .replace(/[\s\u2000-\u206F\u2E00-\u2E7F\\'"“”‘’.,!?;:()\[\]{}<>/|+=_~`@#$%^&*]/g, "")
    .trim();

  return cleaned;
};

const pickWordFromTarget = (target: EventTarget | null) => {
  const element = target instanceof HTMLElement ? target.closest("[data-word]") : null;
  const rawValue = element?.getAttribute("data-word") ?? "";
  return normalizeWord(rawValue);
};

const pickWordFromPoint = (x: number, y: number) => {
  if (!("caretPositionFromPoint" in document) && !("caretRangeFromPoint" in document)) {
    return "";
  }

  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };

  let node: Node | null = null;
  let offset = 0;

  if (doc.caretPositionFromPoint) {
    const caret = doc.caretPositionFromPoint(x, y);
    node = caret?.offsetNode ?? null;
    offset = caret?.offset ?? 0;
  } else if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(x, y);
    node = range?.startContainer ?? null;
    offset = range?.startOffset ?? 0;
  }

  if (!node || node.nodeType !== Node.TEXT_NODE) {
    return "";
  }

  const text = node.textContent ?? "";
  if (!text) {
    return "";
  }

  const safeOffset = Math.max(0, Math.min(offset, text.length));
  let start = safeOffset;
  let end = safeOffset;

  while (start > 0 && /[\p{L}\p{N}_'-]/u.test(text[start - 1])) {
    start -= 1;
  }

  while (end < text.length && /[\p{L}\p{N}_'-]/u.test(text[end])) {
    end += 1;
  }

  return normalizeWord(text.slice(start, end));
};

type InAppWordsSelectionProps = {
  enabled: boolean;
  onWordSelected: (text: string, position?: { x: number; y: number }) => void;
};

const getSelectionCoordinates = () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

export function InAppWordsSelection({ enabled, onWordSelected }: InAppWordsSelectionProps) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const cursorRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isProcessingSelectionRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      isProcessingSelectionRef.current = false;
      return;
    }

    const handleSelection = () => {
      if (isProcessingSelectionRef.current) {
        return;
      }

      isProcessingSelectionRef.current = true;

      const selectedText = normalizeWord(window.getSelection()?.toString() ?? "");
      const selectionPoint = getSelectionCoordinates() ?? cursorRef.current ?? null;

      if (selectedText) {
        console.log("[InAppWordsSelection] selected via text selection:", selectedText, selectionPoint);
        onWordSelected(selectedText, selectionPoint ?? undefined);
        return;
      }

      const element = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const value = pickWordFromTarget(element);
      if (value) {
        console.log("[InAppWordsSelection] selected via active element:", value, selectionPoint);
        onWordSelected(value, selectionPoint ?? undefined);
      } else {
        isProcessingSelectionRef.current = false;
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (isProcessingSelectionRef.current) {
        return;
      }

      isProcessingSelectionRef.current = true;

      const point = { x: event.clientX, y: event.clientY };
      const fromPoint = pickWordFromPoint(event.clientX, event.clientY);
      const text = fromPoint || pickWordFromTarget(event.target);
      if (!text) {
        isProcessingSelectionRef.current = false;
        return;
      }

      console.log("[InAppWordsSelection] selected via click:", text, point);
      onWordSelected(text, point);
    };

    const handleMouseUp = () => {
      if (window.getSelection()?.toString()) {
        handleSelection();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const nextCursor = { x: event.clientX, y: event.clientY };
      cursorRef.current = nextCursor;
      setCursor(nextCursor);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        isProcessingSelectionRef.current = false;
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("keydown", handleEscape);
      setCursor(null);
      isProcessingSelectionRef.current = false;
    };
  }, [enabled, onWordSelected]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="word-selection__overlay" aria-hidden="true">
      <div className="word-selection__overlay-grid" />
      {cursor && (
        <>
          <div className="word-selection__crosshair word-selection__crosshair--vertical" style={{ left: cursor.x }} />
          <div className="word-selection__crosshair word-selection__crosshair--horizontal" style={{ top: cursor.y }} />
        </>
      )}
    </div>
  );
}
