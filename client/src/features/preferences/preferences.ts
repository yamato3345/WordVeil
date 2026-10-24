export type Theme = "light" | "dark" | "system";
export type Preferences = {
  theme: Theme;
  captureWords: boolean;
  profile: { name: string; bio: string; nativeLanguage: string; dailyGoal: number };
};

export const STORAGE_KEY = "wordveil.preferences.v1";
export const defaultPreferences: Preferences = {
  theme: "system",
  captureWords: true,
  profile: { name: "", bio: "", nativeLanguage: "uk", dailyGoal: 10 },
};

export function parsePreferences(value: string | null): Preferences {
  try {
    const data = JSON.parse(value ?? "null");
    if (!data || typeof data !== "object") return defaultPreferences;
    const profile = data.profile;
    return {
      theme: ["light", "dark", "system"].includes(data.theme) ? data.theme : "system",
      captureWords: typeof data.captureWords === "boolean" ? data.captureWords : true,
      profile: {
        name: typeof profile?.name === "string" ? profile.name.slice(0, 60) : "",
        bio: typeof profile?.bio === "string" ? profile.bio.slice(0, 240) : "",
        nativeLanguage: ["uk", "en", "pl", "de", "es", "fr"].includes(profile?.nativeLanguage) ? profile.nativeLanguage : "uk",
        dailyGoal: Number.isInteger(profile?.dailyGoal) && profile.dailyGoal >= 1 && profile.dailyGoal <= 100 ? profile.dailyGoal : 10,
      },
    };
  } catch {
    return defaultPreferences;
  }
}

export function readPreferences(): Preferences {
  try { return parsePreferences(localStorage.getItem(STORAGE_KEY)); }
  catch { return defaultPreferences; }
}

export function applyTheme(theme: Theme): void {
  const resolved = theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}
