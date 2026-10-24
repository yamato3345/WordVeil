import { useState } from "react";
import { Alphabet } from "../alphabet/Alphabet";
import "./Sidebar.scss";

type NavItem = {
  icon: string;
  label: string;
};

type SidebarProps = {
  navItems: NavItem[];
  alphabetItems: string[];
  activePage: string;
  onNavigate: (page: string) => void;
  profileName: string;
};

const fallbackNavItems: NavItem[] = [
  { label: "Dictionary", icon: "/icons/dictionary.svg" },
  { label: "Favorites", icon: "/icons/favorites.svg" },
  { label: "Settings", icon: "/icons/settings.svg" },
];

export function Sidebar({ navItems, alphabetItems, activePage, onNavigate, profileName }: SidebarProps) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const resolvedNavItems = navItems?.length ? navItems : fallbackNavItems;

  return (
    <aside className="sidebar">
      <nav className="nav">
        <ul className="nav-block">
          {resolvedNavItems.map((item) => {
            const isActive = activePage === item.label;

            return (
              <li key={item.label}>
                <button
                  type="button"
                  className={`nav-item${isActive ? " is-active" : ""}`}
                  onClick={() => onNavigate(item.label)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <img className="nav-icon" src={item.icon} alt="" />
                  <span className="nav-title">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="alphabet-block">
        <p className="alphabet-label">Alphabet</p>
        <Alphabet items={alphabetItems} selectedLetter={selectedLetter} onSelect={setSelectedLetter} />
      </div>

      <button
        type="button"
        className={`profile-link ${activePage === "Profile" ? "is-active" : ""}`}
        onClick={() => onNavigate("Profile")}
        aria-current={activePage === "Profile" ? "page" : undefined}
      >
        <span className="profile-link__avatar" aria-hidden="true">
          {Array.from(profileName.trim() || "W")[0].toUpperCase()}
        </span>
        <span>
          <strong>{profileName || "My profile"}</strong>
          <small>Personal workspace</small>
        </span>
        <span aria-hidden="true">›</span>
      </button>
      <div className="sidebar__footer">
        <div className="sidebar__promo">
          <p>A little progress<br />each day adds up<br />to big results.”</p>
          <img className="sidebar-img" src="/img/light.svg" alt="Books beside a glowing lantern" />
        </div>
        <div className="sidebar__status"><span className="status-dot" />Online</div>
      </div>
    </aside>
  );
}
