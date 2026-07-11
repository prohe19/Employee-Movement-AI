import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { authApi } from "../api/endpoints";
import type { User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { user } = await authApi.me();
      setUser(user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
