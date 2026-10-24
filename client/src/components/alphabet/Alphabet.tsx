import "./Alphabet.scss";

type AlphabetProps = {
  items?: string[];
  selectedLetter?: string | null;
  onSelect?: (letter: string) => void;
};

export function Alphabet({
  items = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
  selectedLetter = null,
  onSelect,
}: AlphabetProps) {
  return (
    <div className="alphabet-panel" role="group" aria-label="Alphabet navigation">
      {items.map((char) => (
        <button
          key={char}
          type="button"
          className={`alphabet-item${char === selectedLetter ? " is-active" : ""}`}
          aria-pressed={char === selectedLetter}
          onClick={() => onSelect?.(char)}
        >
          {char}
        </button>
      ))}
    </div>
  );
}
