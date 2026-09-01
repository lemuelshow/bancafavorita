"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { request } from "@/lib/api-client";
import type { PublicUser } from "@/lib/types";

const TOKEN_KEY = "bf_token";

type RegisterInput = {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  password: string;
  ref?: string;
  cambista?: string;
};

type AuthContextValue = {
  user: PublicUser | null;
  token: string | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<PublicUser>;
  register: (input: RegisterInput) => Promise<PublicUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
    if (!saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de sessão: não há dado a buscar, apenas destrava a UI.
      setLoading(false);
      return;
    }
    request<{ user: PublicUser }>("/api/me", { token: saved })
      .then(({ user }) => {
        setUser(user);
        setToken(saved);
      })
      .catch(() => window.localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const applySession = useCallback((newToken: string, newUser: PublicUser) => {
    setToken(newToken);
    setUser(newUser);
    window.localStorage.setItem(TOKEN_KEY, newToken);
  }, []);

  const login = useCallback(
    async (loginStr: string, password: string) => {
      const data = await request<{ token: string; user: PublicUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ login: loginStr, password }),
      });
      applySession(data.token, data.user);
      return data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await request<{ token: string; user: PublicUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      applySession(data.token, data.user);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(TOKEN_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { user } = await request<{ user: PublicUser }>("/api/me", { token });
      setUser(user);
    } catch {
      // silencioso
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, refreshUser }),
    [user, token, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
