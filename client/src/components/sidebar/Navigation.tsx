type NavigationItem = {
  icon: string;
  label: string;
  active?: boolean;
};

type NavigationProps = {
  items: NavigationItem[];
};

export function Navigation({ items }: NavigationProps) {
  return (
    <nav className="nav" aria-label="Main navigation">
      {items.map(({ icon, label, active }) => (
        <button
          key={label}
          type="button"
          className={`nav-item ${active ? "is-active" : ""}`}
        >
          <span className="nav-item__icon" aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
