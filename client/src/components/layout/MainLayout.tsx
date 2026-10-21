import { useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Alphabet } from "../alphabet/Alphabet";
import { WordList } from "../word-list/WordList";
import { WordSelection } from "../../features/word-selection/WordSelection";
import "./MainLayout.scss";

type WindowActionType = "minimize" | "maximize" | "close";

type WindowControlButtonProps = {
  action: WindowActionType;
  label: string;
  icon: string;
  onClick: (action: WindowActionType) => void;
  variant?: "default" | "danger";
};

const appWindow = getCurrentWindow();

const navItems = [
  { icon: "📘", label: "Dictionary", active: true },
  { icon: "☆", label: "Favorites" },
  { icon: "🕘", label: "History" },
  { icon: "⚙", label: "Settings" },
];

const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

const wordEntries = [
  { word: "abandon", type: "verb", isSelected: true },
  { word: "ability", type: "noun" },
  { word: "abnormal", type: "adjective" },
  { word: "abolish", type: "verb" },
  { word: "absolutely", type: "adverb" },
  { word: "absorb", type: "verb" },
  { word: "abstract", type: "adjective" },
  { word: "academy", type: "noun" },
  { word: "accelerate", type: "verb" },
  { word: "accent", type: "noun" },
  { word: "accept", type: "verb" },
  { word: "access", type: "noun" },
  { word: "accident", type: "noun" },
  { word: "accomplish", type: "verb" },
];

const meaningExamples = [
  "to leave someone or something, usually without intending to return",
  "to give up completely; stop trying",
  "to show no care or support for someone or something",
];

const windowControls: Array<Omit<WindowControlButtonProps, "onClick">> = [
  { action: "minimize", label: "Minimize", icon: "—", variant: "default" },
  { action: "maximize", label: "Toggle maximize", icon: "□", variant: "default" },
  { action: "close", label: "Close", icon: "✕", variant: "danger" },
];

function WindowControlButton({ action, label, icon, onClick, variant = "default" }: WindowControlButtonProps) {
  return (
    <button
      type="button"
      className={`window-button ${variant === "danger" ? "is-danger" : ""}`.trim()}
      aria-label={label}
      title={label}
      onClick={() => onClick(action)}
    >
      {icon}
    </button>
  );
}

export function MainLayout() {
  const handleWindowAction = useCallback(async (action: WindowActionType) => {
    try {
      switch (action) {
        case "minimize":
          await appWindow.minimize();
          return;
        case "maximize":
          await appWindow.toggleMaximize();
          return;
        case "close":
          await appWindow.close();
          return;
        default:
          return;
      }
    } catch (error) {
      console.error(`Failed to handle window action: ${action}`, error);
    }
  }, []);

  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="titlebar__left" data-tauri-drag-region>
          <div className="brand" aria-hidden="true">
            <span className="brand__icon">📖</span>
          </div>
          <span className="title">Lexar</span>
        </div>

        <div className="titlebar__center" data-tauri-drag-region>
          <label className="search" aria-label="Search a word">
            <span className="search__icon" aria-hidden="true">⌕</span>
            <input type="search" placeholder="Search a word..." aria-label="Search a word" />
            <span className="shortcut">Ctrl + Shift + W</span>
          </label>
        </div>

        <div className="titlebar__right" aria-label="Window controls">
          {windowControls.map(({ action, label, icon, variant }) => (
            <WindowControlButton
              key={action}
              action={action}
              label={label}
              icon={icon}
              variant={variant}
              onClick={handleWindowAction}
            />
          ))}
        </div>
      </header>

      <main className="layout-shell">
        <WordSelection />

        <aside className="sidebar">
          <nav className="nav" aria-label="Main navigation">
            {navItems.map(({ icon, label, active }) => (
              <button key={label} type="button" className={`nav-item ${active ? "is-active" : ""}`} data-word={label}>
                <span className="nav-item__icon">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <Alphabet items={alphabet} activeIndex={0} />

          <div className="sidebar__footer">
            <div className="progress-illustration" aria-hidden="true">
              <div className="book-stack" />
              <div className="lantern" />
            </div>
            <p>
              A little progress
              <span>each day adds up</span>
              <small>to big results.</small>
            </p>
          </div>
        </aside>

        <WordList items={wordEntries} totalLabel={`${wordEntries.length} words`} />

        <section className="detail-panel" aria-label="Word detail">
          <div className="word-hero">
            <div className="word-hero__topline">
              <h1 data-word="abandon">abandon</h1>
              <button type="button" className="word-sound" aria-label="Play pronunciation">
                ◉
              </button>
            </div>

            <div className="word-hero__pronunciation">/əˈbændən/</div>

            <div className="word-tags">
              <span className="tag tag--filled">verb</span>
              <span className="tag">B2</span>
            </div>
          </div>

          <div className="detail-tabs">
            <button type="button" className="detail-tab is-active">Meaning</button>
            <button type="button" className="detail-tab">Examples</button>
            <button type="button" className="detail-tab">Usage</button>
            <button type="button" className="detail-tab">Synonyms &amp; Antonyms</button>
          </div>

          <div className="detail-card">
            <div className="card-heading">
              <span className="card-icon">📝</span>
              <h3>Meanings</h3>
            </div>

            <ol className="meaning-list">
              {meaningExamples.map((item, index) => (
                <li key={item}>
                  <span className="meaning-index">{index + 1}.</span>
                  <div>
                    <p>{item}</p>
                    {index === 0 && <span className="pill">most common</span>}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="detail-card compact">
            <div className="card-heading">
              <span className="card-icon">🧠</span>
              <h3>Context / Usage</h3>
            </div>

            <ul className="context-list">
              <li>In personal life: “She abandoned her old life and moved to a new city.”</li>
              <li>In business: “The company abandoned the idea due to high costs.”</li>
              <li>In a figurative sense: “He felt abandoned by everyone.”</li>
            </ul>
          </div>

          <div className="pair-grid">
            <div className="mini-card">
              <div className="mini-card__header">
                <span className="mini-card__icon">✦</span>
                <span>Synonyms</span>
              </div>
              <p>leave, desert, give up, forsake, relinquish</p>
            </div>

            <div className="mini-card is-danger">
              <div className="mini-card__header">
                <span className="mini-card__icon">❤</span>
                <span>Antonyms</span>
              </div>
              <p>keep, continue, support, maintain, retain</p>
            </div>
          </div>

          <div className="fact-box">
            <div className="fact-box__header">
              <span className="fact-box__icon">✎</span>
              <span>Did you know?</span>
            </div>
            <p>“Abandon” can also be used as a noun (e.g. “the abandonment of the project”).</p>
          </div>
        </section>
      </main>
    </div>
  );
}