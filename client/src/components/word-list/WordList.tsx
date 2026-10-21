import "./WordList.scss";

type WordListItem = {
  word: string;
  type: string;
  isSelected?: boolean;
};

type WordListProps = {
  items: WordListItem[];
  totalLabel?: string;
};

export function WordList({ items, totalLabel = `${items.length} words` }: WordListProps) {
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
              <span className="word-entry__icon">📖</span>
              <span className="word-entry__word" data-word={word}>{word}</span>
              <span className="word-entry__type" data-word={type}>{type}</span>
            </div>
            <button type="button" className="favorite-button" aria-label={`Save ${word}`}>
              ☆
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
