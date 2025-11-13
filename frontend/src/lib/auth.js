import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { get, post } from "./api";
const Ctx = createContext({
    user: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
    error: null,
});
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let active = true;
        get("/api/auth/me")
            .then((r) => {
            if (active)
                setUser(r.user);
        })
            .catch(() => { })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false; // evita “destroy is not a function”
        };
    }, []);
    const login = async (username, password) => {
        setError(null);
        try {
            await post("/api/auth/login", { username, password });
            const r = await get("/api/auth/me");
            setUser(r.user);
        }
        catch (e) {
            const err = e;
            setError(err.message || err.error || "Falha no login");
            throw e;
        }
    };
    const logout = async () => {
        try {
            await post("/api/auth/logout", {});
        }
        finally {
            setUser(null);
        }
    };
    return (_jsx(Ctx.Provider, { value: { user, loading, login, logout, error }, children: children }));
}
export const useAuth = () => useContext(Ctx);
