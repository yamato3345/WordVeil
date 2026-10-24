import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { applyTheme, readPreferences, STORAGE_KEY, type Preferences } from "./preferences";

type PreferencesContextValue = {
  preferences: Preferences;
  resolvedTheme: "light" | "dark";
  storageError: boolean;
  updatePreferences: (patch: Partial<Preferences>) => void;
};
const darkModeQuery = matchMedia("(prefers-color-scheme: dark)");
const subscribeToSystemTheme = (notify: () => void) => {
  darkModeQuery.addEventListener("change", notify);
  return () => darkModeQuery.removeEventListener("change", notify);
};
const getSystemTheme = () => darkModeQuery.matches;
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(readPreferences);
  const [storageError, setStorageError] = useState(false);
  const systemDark = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme);
  const resolvedTheme = preferences.theme === "system" ? (systemDark ? "dark" : "light") : preferences.theme;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setStorageError(false);
    } catch { setStorageError(true); }
  }, [preferences]);

  return <PreferencesContext.Provider value={{ preferences, resolvedTheme, storageError, updatePreferences: patch => setPreferences(current => ({ ...current, ...patch })) }}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences requires PreferencesProvider");
  return context;
}
