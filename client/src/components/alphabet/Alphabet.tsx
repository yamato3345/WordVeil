import "./Alphabet.scss";

type AlphabetProps = {
  items?: string[];
  activeIndex?: number;
};

export function Alphabet({
  items = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
  activeIndex = 0,
}: AlphabetProps) {
  return (
    <div className="alphabet-panel" aria-label="Alphabet navigation">
      {items.map((char, index) => (
        <button
          key={char}
          type="button"
          className={`alphabet-item ${index === activeIndex ? "is-active" : ""}`}
        >
          {char}
        </button>
      ))}
    </div>
  );
}
