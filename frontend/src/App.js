import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastHost from "./components/Toast";
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
function Header({ onToggle, theme, setTheme }) {
    const { user, logout } = useAuth();
    return (_jsxs("div", { className: "app-header", children: [_jsx("button", { className: "btn icon", "aria-label": "menu", onClick: onToggle, children: "\u2630" }), _jsx("div", { style: { width: 28, height: 28, borderRadius: 8, background: "var(--primary)" } }), _jsx("div", { style: { fontWeight: 700, marginLeft: 8 }, children: "GMUD" }), _jsxs("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }, children: [user && _jsxs("div", { className: "badge", children: [user.name, " \u00B7 ", user.role] }), _jsx("button", { className: "btn", onClick: () => setTheme(theme === "dark" ? "light" : "dark"), children: theme === "dark" ? "Modo claro" : "Modo escuro" }), user && _jsx("button", { className: "btn", onClick: logout, children: "Sair" })] })] }));
}
function Sidebar({ collapsed }) {
    const { pathname } = useLocation();
    return (_jsx("aside", { className: "aside" + (collapsed ? " collapsed" : ""), style: { left: 0, top: 56, bottom: 0, position: "fixed" }, children: NAV.map((n) => (_jsx(Link, { to: n.to, children: _jsxs("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: pathname === n.to
                        ? "color-mix(in oklab, var(--accent) 25%, transparent)"
                        : "transparent",
                    fontWeight: pathname === n.to ? 600 : 400,
                }, children: [_jsx("span", { children: n.icon }), !collapsed && _jsx("span", { children: n.label })] }) }, n.to))) }));
}
function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(true);
    const [theme, setTheme] = useState(() => localStorage.getItem("gmud_theme") || "light");
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("gmud_theme", theme);
    }, [theme]);
    return (_jsxs(_Fragment, { children: [_jsx(Header, { onToggle: () => setCollapsed(v => !v), theme: theme, setTheme: setTheme }), _jsx(Sidebar, { collapsed: collapsed }), _jsx("main", { className: "main" + (collapsed ? " collapsed" : ""), children: _jsx("div", { className: "container", children: children }) })] }));
}
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading)
        return _jsxs(_Fragment, { children: [_jsx("div", { className: "app-header", children: _jsx("div", { className: "help", children: "Carregando\u2026" }) }), _jsx("main", { className: "main collapsed", children: _jsx("div", { className: "container", children: _jsx("div", { className: "help", children: "Autenticando\u2026" }) }) })] });
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    return (_jsx(ErrorBoundary, { children: _jsx(AuthProvider, { children: _jsxs(BrowserRouter, { children: [_jsx(ToastHost, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/externo/solicitacao", element: _jsx(SolicitacaoAvulsa, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(Dashboard, {}) }) }) }), _jsx(Route, { path: "/solicitacoes", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(ListSolicitacoes, {}) }) }) }), _jsx(Route, { path: "/solicitacoes/nova", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(NovaSolicitacao, {}) }) }) }), _jsx(Route, { path: "/solicitacoes/:id", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(DetalheSolicitacao, {}) }) }) }), _jsx(Route, { path: "/gmuds", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(ListGmuds, {}) }) }) }), _jsx(Route, { path: "/gmuds/:id", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(DetalheGmud, {}) }) }) }), _jsx(Route, { path: "/recursos", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(Recursos, {}) }) }) }), _jsx(Route, { path: "/papeis", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(Papeis, {}) }) }) }), _jsx(Route, { path: "/status", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(StatusPage, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx("div", { className: "container", style: { paddingTop: 16 }, children: _jsx("div", { className: "alert", children: "P\u00E1gina n\u00E3o encontrada" }) }) })] })] }) }) }));
}
