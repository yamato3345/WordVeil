import "./WordList.scss";
import { DesignIcon } from "../ui/DesignIcon";

type WordListItem = {
  word: string;
  type: string;
  isSelected?: boolean;
};

type WordListProps = {
  items: WordListItem[];
  totalLabel?: string;
  favoriteWords: string[];
  onToggleFavorite: (word: string) => void;
};

export function WordList({ items, totalLabel = `${items.length} words`, favoriteWords, onToggleFavorite }: WordListProps) {
  return (
    <section className="word-list-panel" aria-label="Word list">
      <div className="section-head">
        <h2>Words</h2>
        <span>{totalLabel}</span>
      </div>

      <ul className="word-list">
        {items.map(({ word, type, isSelected }) => (
          <li key={word} className={isSelected ? "is-selected" : ""}>
            <div className="word-entry">
              <img className="word-entry__icon" src="/icons/dictionary.svg" alt="" />
              <span className="word-entry__word" data-word={word}>{word}</span>
              <span className="word-entry__type" data-word={type}>{type}</span>
            </div>
            <button
              type="button"
              className={`favorite-button${favoriteWords.includes(word) ? " is-favorite" : ""}`}
              aria-label={`Favorite ${word}`}
              aria-pressed={favoriteWords.includes(word)}
              onClick={() => onToggleFavorite(word)}
            >
              <DesignIcon name="star" />
            </button>
          </li>
        ))}
      </ul>

      <div className="pager">
        <button type="button" aria-label="Previous page">←</button>
        <span>1 / 3</span>
        <button type="button" aria-label="Next page">→</button>
      </div>
    </section>
  );
}
