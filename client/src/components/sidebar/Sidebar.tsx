import { Navigation } from "./Navigation";
import "./Sidebar.scss";

type SidebarProps = {
  navItems: Array<{ icon: string; label: string; active?: boolean }>;
};

export function Sidebar({ navItems }: SidebarProps) {
  return (
    <aside className="sidebar">
      <Navigation items={navItems} />

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
        <div className="sidebar__status" aria-label="Online status">
          <span className="status-dot" aria-hidden="true" />
          <span>Online</span>
        </div>
      </div>
    </aside>
  );
}
