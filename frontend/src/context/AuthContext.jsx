import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchSession } from "../api/fetchSession.js";

/** @typedef {{ id: string, email: string, name: string, role: 'user' | 'admin' | 'sysmanager', provider: string }} AuthUser */

/** @type {React.Context<{ user: AuthUser | null | undefined, refresh: () => Promise<void>, logout: () => Promise<void> } | null>} */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /** @type {[AuthUser | null | undefined, React.Dispatch<React.SetStateAction<AuthUser | null | undefined>>]} */
  const [user, setUser] = useState(undefined);

  const refresh = useCallback(async () => {
    try {
      const r = await fetchSession("/api/auth/me");
      const d = await r.json();
      setUser(d.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetchSession("/api/auth/logout", { method: "POST", body: "{}" });
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, refresh, logout }), [user, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth trong AuthProvider");
  return ctx;
}
