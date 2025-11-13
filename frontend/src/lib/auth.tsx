import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiError, get, post } from "./api";

type User = { uid: number; username: string; role: string; name: string; };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    get("/api/auth/me")
      .then((r: any) => {
        if (active) setUser(r.user);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false; // evita “destroy is not a function”
    };
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      await post("/api/auth/login", { username, password });
      const r = await get("/api/auth/me");
      setUser(r.user);
    } catch (e: any) {
      const err = e as ApiError;
      setError(err.message || err.error || "Falha no login");
      throw e;
    }
  };

  const logout = async () => {
    try {
      await post("/api/auth/logout", {});
    } finally {
      setUser(null);
    }
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
