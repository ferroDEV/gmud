import React, { createContext, useContext, useEffect, useState } from "react";
import { get, post } from "./api";

type User = { uid: number; username: string; role: string; name: string; };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, loading: true, login: async ()=>{}, logout: async ()=>{} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get("/api/auth/me").then((r:any)=> setUser(r.user)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    await post("/api/auth/login", { username, password });
    const r = await get("/api/auth/me");
    setUser(r.user);
  };
  const logout = async () => {
    await post("/api/auth/logout", {});
    setUser(null);
    window.location.href = "/login";
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx);
