import { useCallback, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WordList } from "../word-list/WordList";
import { WordSelection } from "../../features/word-selection/WordSelection";
import { Sidebar } from "../sidebar/Sidebar";
import { DesignIcon } from "../ui/DesignIcon";
import "./MainLayout.scss";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { ProfilePage } from "../../features/profile/ProfilePage";
import { useFavorites } from "../../features/favorites/useFavorites";
import { usePreferences } from "../../features/preferences/PreferencesProvider";

type WindowActionType = "minimize" | "maximize" | "close";

type WindowControlButtonProps = {
  action: WindowActionType;
  label: string;
  icon: string;
  onClick: (action: WindowActionType) => void;
  variant?: "default" | "danger";
};



const navItems = [
  { icon: "/icons/dictionary.svg", label: "Dictionary", active: true },
  { icon: "/icons/favorites.svg", label: "Favorites" },
  { icon: "/icons/history.svg", label: "History" },
  { icon: "/icons/settings.svg", label: "Settings" },
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
  const { favoriteWords, toggleFavorite } = useFavorites();
  const saved = favoriteWords.includes("abandon");
  const [page, setPage] = useState("Dictionary");
  const { preferences, resolvedTheme, updatePreferences } = usePreferences();
  const isWorkspacePage = page === "Settings" || page === "Profile";
  const toggleTheme = () => {
    updatePreferences({ theme: resolvedTheme === "dark" ? "light" : "dark" });
  };
  const handleWindowAction = useCallback(async (action: WindowActionType) => {
    try {
      const appWindow = getCurrentWindow();
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
          {/* Previous logo and title — uncomment to restore.
          <div className="brand" aria-hidden="true">
            <img className="brand__icon" src="/logos/logo.svg" alt="" />
          </div>
          <span className="title">WordVeil</span>
          */}
          <img
            className="brand__logo"
            src={resolvedTheme === "dark" ? "/logos/dark_logo.png" : "/logos/light_logo.png"}
            alt="WordVeil"
          />
        </div>

        <div className="titlebar__center" data-tauri-drag-region>
          <label className="search" aria-label="Search a word">
            <span className="search__icon"><DesignIcon name="search" /></span>
            <input type="search" placeholder="Search a word..." aria-label="Search a word" />
            <span className="shortcut">Ctrl + Shift + W</span>
          </label>
        </div>

        <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle dark theme" aria-pressed={resolvedTheme === "dark"} title="Switch light / dark theme"><DesignIcon name="theme" /></button>
        <button className="titlebar-settings" type="button" aria-label="Settings" onClick={() => setPage("Settings")}><img src="/icons/settings.svg" alt="" /></button>

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
        <WordSelection active={preferences.captureWords} />

        <Sidebar navItems={navItems} alphabetItems={alphabet} activePage={page} onNavigate={setPage} profileName={preferences.profile.name} />

        {isWorkspacePage ? (page === "Settings" ? <SettingsPage onOpenProfile={() => setPage("Profile")} /> : <ProfilePage />) : <>


        <WordList items={wordEntries} totalLabel={`${wordEntries.length} words`} favoriteWords={favoriteWords} onToggleFavorite={toggleFavorite} />

        <section className="detail-panel" aria-label="Word detail">
          <div className="word-hero">
            <div className="hero-actions">
              <button type="button" aria-label="Save abandon" aria-pressed={saved} onClick={() => toggleFavorite("abandon")} className={saved ? "is-saved" : ""}><DesignIcon name="heart" /></button>
              <span className="hero-more" aria-hidden="true"><DesignIcon name="more" /></span>
            </div>
            <div className="word-hero__topline">
              <h1 data-word="abandon">abandon</h1>
              <button type="button" className="word-sound" aria-label="Play pronunciation">
                <DesignIcon name="sound" />
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
              <span className="card-icon"><DesignIcon name="document" /></span>
              <h3>Meanings</h3>
            </div>

            <ol className="meaning-list">
              {meaningExamples.map((item, index) => (
                <li key={item}>
                  <span className="meaning-index">{index + 1}.</span>
                  <div>
                    <p>{item}</p>
                    <em className="meaning-example">“{["He abandoned his car on the roadside.", "She decided to abandon the project.", "The government abandoned the plan."][index]}”</em>
                    {index === 0 && <span className="pill">most common</span>}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="detail-card compact">
            <div className="card-heading">
              <span className="card-icon"><DesignIcon name="document" /></span>
              <h3>Context / Usage</h3>
            </div>

            <ul className="context-list">
              <li>In personal life: <em>“She abandoned her old life and moved to a new city.”</em></li>
              <li>In business: <em>“The company abandoned the idea due to high costs.”</em></li>
              <li>In a figurative sense: <em>“He felt abandoned by everyone.”</em></li>
            </ul>
          </div>

          <div className="pair-grid">
            <div className="mini-card">
              <div className="mini-card__header">
                <span className="mini-card__icon synonym-icon">♨</span>
                <span>Synonyms</span>
              </div>
              <p>leave, desert, give up, forsake, relinquish</p>
            </div>

            <div className="mini-card is-danger">
              <div className="mini-card__header">
                <span className="mini-card__icon antonym-icon"><DesignIcon name="heart" /></span>
                <span>Antonyms</span>
              </div>
              <p>keep, continue, support, maintain, retain</p>
            </div>
          </div>

          <div className="fact-box">
            <div className="fact-box__header">
              <span className="fact-box__icon"><DesignIcon name="spark" /></span>
              <span>Did you know?</span>
            </div>
            <p>“Abandon” can also be a noun, meaning complete freedom from restraint: “with wild abandon.”</p>
          </div>
        </section>
        </>}
      </main>
    </div>
  );
}
