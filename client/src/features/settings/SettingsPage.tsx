import { usePreferences } from "../preferences/PreferencesProvider";
import type { Theme } from "../preferences/preferences";

const themes: { value: Theme; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "A warm, paper-like workspace" },
  { value: "dark", label: "Dark", description: "Deep navy with soft violet accents" },
  { value: "system", label: "System", description: "Follow your device’s appearance" },
];

export function SettingsPage({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { preferences, updatePreferences, storageError } = usePreferences();

  return (
    <section className="workspace-page" aria-labelledby="settings-title">
      <div className="page-intro">
        <span className="page-eyebrow">MAKE IT YOURS</span>
        <h1 id="settings-title">Settings</h1>
        <p>A comfortable space for every new word.</p>
      </div>

      <div className="preferences-card">
        <h2>Appearance</h2>
        <p>Choose the look that feels right for you.</p>
        <fieldset className="theme-options">
          <legend className="visually-hidden">Color theme</legend>
          {themes.map((theme) => (
            <label
              className={`theme-option ${preferences.theme === theme.value ? "is-selected" : ""}`}
              key={theme.value}
            >
              <input
                type="radio"
                name="theme"
                value={theme.value}
                checked={preferences.theme === theme.value}
                onChange={() => updatePreferences({ theme: theme.value })}
              />
              <span className={`theme-preview theme-preview--${theme.value}`} aria-hidden="true">
                <i />
                <span><b /><b /><b /></span>
              </span>
              <span className="theme-option__label">{theme.label}</span>
              <small>{theme.description}</small>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="preferences-card">
        <h2>Word capture</h2>
        <div className="setting-row">
          <div>
            <label htmlFor="capture-words">Show the selected word</label>
            <p>Display a floating word card when you copy a word with Ctrl+C.</p>
          </div>
          <input
            id="capture-words"
            className="switch-input"
            type="checkbox"
            role="switch"
            checked={preferences.captureWords}
            onChange={(event) => updatePreferences({ captureWords: event.target.checked })}
          />
        </div>
        <div className="setting-note">
          The card disappears after 3.3 seconds. Capture runs while WordVeil is open.
        </div>
      </div>

      <div className="preferences-card">
        <h2>Your learning profile</h2>
        <div className="setting-row">
          <div>
            <strong>Make it personal</strong>
            <p>Update your name, native language, and daily word goal.</p>
          </div>
          <button className="secondary-button" type="button" onClick={onOpenProfile}>
            Edit profile <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>

      <p className={`save-status ${storageError ? "is-error" : ""}`} role="status">
        {storageError
          ? "Changes work for this session, but could not be saved on this device."
          : "Settings are saved automatically on this device."}
      </p>
    </section>
  );
}
