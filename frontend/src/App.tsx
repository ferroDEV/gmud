import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastHost from "./components/Toast";
import { RiAdminFill } from "react-icons/ri";


import Dashboard from "./pages/Dashboard";
import Recursos from "./pages/Recursos";
import Papeis from "./pages/Papeis";
import StatusPage from "./pages/Status";
import ListSolicitacoes from "./pages/Solicitacoes/List";
import NovaSolicitacao from "./pages/Solicitacoes/New";
import DetalheSolicitacao from "./pages/Solicitacoes/Detail";
import ListGmuds from "./pages/Gmuds/List";
import DetalheGmud from "./pages/Gmuds/Detail";
import Login from "./pages/Login";
import SolicitacaoAvulsa from "./pages/Public/SolicitacaoAvulsa";

const NAV = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/solicitacoes", label: "Solicitações", icon: "🗂️" },
  { to: "/gmuds", label: "GMUD", icon: "🛠️" },
  { to: "/recursos", label: "Recursos", icon: "👥" },
  { to: "/papeis", label: "Papéis", icon: "🛡️" },
  { to: "/status", label: "Status", icon: "🏷️" },
];

function Header({ onToggle, theme, setTheme }: { onToggle: () => void; theme: string; setTheme: (t: string) => void }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-header">
      <button className="btn icon" aria-label="menu" onClick={onToggle}>☰</button>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--primary)" }} />
      <div style={{ fontWeight: 700, marginLeft: 8 }}>GMUD</div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {user && <div className="badge">{user.name} · {user.role}</div>}
        <button className="btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "Modo claro" : "Modo escuro"}
        </button>
        {user && <button className="btn" onClick={logout}>Sair</button>}
      </div>
    </div>
  );
}

function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { pathname } = useLocation();
  return (
    <aside
      className={"aside" + (collapsed ? " collapsed" : "")}
      style={{ left: 0, top: 56, bottom: 0, position: "fixed" }}
    >
      {NAV.map((n) => (
        <Link key={n.to} to={n.to}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 10,
              background:
                pathname === n.to
                  ? "color-mix(in oklab, var(--accent) 25%, transparent)"
                  : "transparent",
              fontWeight: pathname === n.to ? 600 : 400,
            }}
          >
            <span>{n.icon}</span>
            {!collapsed && <span>{n.label}</span>}
          </div>
        </Link>
      ))}
    </aside>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("gmud_theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gmud_theme", theme);
  }, [theme]);
  return (
    <>
      <Header onToggle={() => setCollapsed(v => !v)} theme={theme} setTheme={setTheme} />
      <Sidebar collapsed={collapsed} />
      <main className={"main" + (collapsed ? " collapsed" : "")}>
        <div className="container">{children}</div>
      </main>
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <><div className="app-header"><div className="help">Carregando…</div></div><main className="main collapsed"><div className="container"><div className="help">Autenticando…</div></div></main></>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ToastHost />
          <Routes>
            <Route path="/externo/solicitacao" element={<SolicitacaoAvulsa />} />
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/solicitacoes" element={<ProtectedRoute><Layout><ListSolicitacoes /></Layout></ProtectedRoute>} />
            <Route path="/solicitacoes/nova" element={<ProtectedRoute><Layout><NovaSolicitacao /></Layout></ProtectedRoute>} />
            <Route path="/solicitacoes/:id" element={<ProtectedRoute><Layout><DetalheSolicitacao /></Layout></ProtectedRoute>} />

            <Route path="/gmuds" element={<ProtectedRoute><Layout><ListGmuds /></Layout></ProtectedRoute>} />
            <Route path="/gmuds/:id" element={<ProtectedRoute><Layout><DetalheGmud /></Layout></ProtectedRoute>} />

            <Route path="/recursos" element={<ProtectedRoute><Layout><Recursos /></Layout></ProtectedRoute>} />
            <Route path="/papeis" element={<ProtectedRoute><Layout><Papeis /></Layout></ProtectedRoute>} />
            <Route path="/status" element={<ProtectedRoute><Layout><StatusPage /></Layout></ProtectedRoute>} />

            <Route path="*" element={<div className="container" style={{ paddingTop: 16 }}><div className="alert">Página não encontrada</div></div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
