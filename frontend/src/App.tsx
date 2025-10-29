import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
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
    <aside className={"aside" + (collapsed ? " collapsed" : "")}>
      {NAV.map(n => (
        <Link key={n.to} to={n.to}>
          <div className={"nav-btn" + (pathname === n.to ? " active" : "")} style={{ marginBottom: 6 }}>
            <span className="nav-icon">{n.icon}</span>
            {!collapsed && <span className="nav-label">{n.label}</span>}
          </div>
        </Link>
      ))}
    </aside>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("gmud_theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gmud_theme", theme);
  }, [theme]);

  if (loading) {
    return (
      <>
        <div className="app-header"><div className="help">Carregando…</div></div>
        <main className="main collapsed"><div className="container"><div className="help">Autenticando…</div></div></main>
      </>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/externo/solicitacao" element={<SolicitacaoAvulsa />} />
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Shell><Dashboard /></Shell>} />
          <Route path="/solicitacoes" element={<Shell><ListSolicitacoes /></Shell>} />
          <Route path="/solicitacoes/nova" element={<Shell><NovaSolicitacao /></Shell>} />
          <Route path="/solicitacoes/:id" element={<Shell><DetalheSolicitacao /></Shell>} />

          <Route path="/gmuds" element={<Shell><ListGmuds /></Shell>} />
          <Route path="/gmuds/:id" element={<Shell><DetalheGmud /></Shell>} />

          <Route path="/recursos" element={<Shell><Recursos /></Shell>} />
          <Route path="/papeis" element={<Shell><Papeis /></Shell>} />
          <Route path="/status" element={<Shell><StatusPage /></Shell>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
