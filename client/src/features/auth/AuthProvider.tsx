import { createContext, useContext, useState, type ReactNode } from "react";
import { AuthPage } from "./AuthPage";
import type { AuthUser } from "./authApi";

type Session = { token: string; user: AuthUser };
const AuthContext = createContext<{ user: AuthUser; logout: () => void } | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  if (!session) return <AuthPage onAuthenticated={setSession} />;
  return <AuthContext.Provider value={{ user: session.user, logout: () => setSession(null) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth requires AuthProvider");
  return auth;
}
