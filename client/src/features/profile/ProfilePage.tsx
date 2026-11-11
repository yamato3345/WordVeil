import { useState, type FormEvent } from "react";
import { usePreferences } from "../preferences/PreferencesProvider";
import { useAuth } from "../auth/AuthProvider";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { preferences, updatePreferences, storageError } = usePreferences();
  const [draft, setDraft] = useState(preferences.profile);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(preferences.profile);
  const initials = (preferences.profile.name.trim() || "Word Learner")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();

  const update = (patch: Partial<typeof draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const profile = { ...draft, name: draft.name.trim(), bio: draft.bio.trim() };
    updatePreferences({ profile });
    setDraft(profile);
    setSaved(true);
  };

  const status = storageError
    ? "Could not save on this device."
    : saved && !dirty
      ? "Profile saved."
      : dirty
        ? "You have unsaved changes."
        : "Your profile stays on this device.";

  return (
    <section className="workspace-page" aria-labelledby="profile-title">
      <div className="page-intro">
        <span className="page-eyebrow">YOUR LEARNING JOURNEY</span>
        <h1 id="profile-title">My profile</h1>
        <p>Little by little, a whole new world of words.</p>
      </div>

      <div className="profile-banner">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <button type="button" className="primary-button" onClick={logout}>Вийти</button>
        </div>
      </div>

      <form className="preferences-card profile-form" onSubmit={save}>
        <h2>Personal details</h2>
        <p>A few details to make this space your own.</p>
        <div className="form-grid">
          <label className="form-field">
            Display name
            <input
              name="displayName"
              autoComplete="nickname"
              maxLength={60}
              placeholder="What should we call you?"
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </label>
          <label className="form-field">
            Native language
            <select value={draft.nativeLanguage} onChange={(event) => update({ nativeLanguage: event.target.value })}>
              <option value="uk">Українська</option>
              <option value="en">English</option>
              <option value="pl">Polski</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </label>
          <label className="form-field form-field--wide">
            About you
            <textarea
              rows={3}
              maxLength={240}
              placeholder="What inspires you to learn?"
              value={draft.bio}
              onChange={(event) => update({ bio: event.target.value })}
            />
            <small>{draft.bio.length} / 240 characters</small>
          </label>
        </div>

        <div className="goal-setting">
          <div>
            <label htmlFor="daily-goal">Daily word goal</label>
            <p>Set a personal target for your learning routine.</p>
          </div>
          <div>
            <input
              id="daily-goal"
              type="number"
              min={1}
              max={100}
              required
              value={Number.isNaN(draft.dailyGoal) ? "" : draft.dailyGoal}
              onChange={(event) => update({ dailyGoal: event.target.valueAsNumber })}
            />
            <span>words / day</span>
          </div>
        </div>

        <div className="form-actions">
          <span role="status">{status}</span>
          <button className="primary-button" type="submit" disabled={!dirty}>Save changes</button>
        </div>
      </form>
    </section>
  );
}
