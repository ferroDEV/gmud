import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { get } from "../../lib/api";
import { Link } from "react-router-dom";
const statusTitle = (i) => {
    const map = { 1: "Análise de investimentos", 2: "Fila de Desenvolvimento", 3: "Desenvolvimento", 4: "Homologação Interna", 5: "Homologação Solicitante", 6: "Go Live", 7: "Finalizado" };
    return map[i] || `Status ${i}`;
};
export default function ListGmuds() {
    const [rows, setRows] = useState([]);
    const [err, setErr] = useState(null);
    const [groupByAnalista, setGroup] = useState(true);
    const load = () => {
        get("/api/gmuds")
            .then(setRows)
            .catch((e) => setErr(e.message || e.error));
    };
    useEffect(() => {
        load();
    }, []);
    const grouped = useMemo(() => {
        if (!groupByAnalista)
            return null;
        const idx = {};
        for (const g of rows) {
            const key = g.analistaRequisitos?.name || "Sem analista";
            (idx[key] || (idx[key] = [])).push(g);
        }
        return idx;
    }, [groupByAnalista, rows]);
    return (_jsxs("div", { className: "grid", style: { gap: 12 }, children: [_jsx("div", { className: "topbar", children: _jsx("input", { className: "input", style: { maxWidth: 320 }, placeholder: "Buscar por t\u00EDtulo" }) }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("strong", { children: "GMUDs" }), _jsxs("label", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("input", { type: "checkbox", checked: groupByAnalista, onChange: e => setGroup(e.target.checked) }), "Agrupar por Analista de Requisitos"] })] }), _jsxs("div", { className: "card-b", children: [err && _jsx("div", { className: "alert", style: { marginBottom: 8 }, children: err }), !groupByAnalista ? (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "T\u00EDtulo" }), _jsx("th", { children: "Solicitante" }), _jsx("th", { children: "Analista" }), _jsx("th", { children: "Status" }), _jsx("th", { style: { width: 90 }, children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { children: rows.map(g => (_jsxs("tr", { children: [_jsx("td", { children: g.titulo }), _jsx("td", { children: g.solicitante.name }), _jsx("td", { children: g.analistaRequisitos?.name || "—" }), _jsx("td", { children: _jsx("span", { className: "badge", children: statusTitle(g.status) }) }), _jsx("td", { children: _jsx(Link, { to: `/gmuds/${g.id}`, className: "btn", children: "Abrir" }) })] }, g.id))) })] })) : (_jsx("div", { className: "grid", style: { gap: 10 }, children: Object.entries(grouped || {}).map(([analista, list]) => (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", children: [_jsx("strong", { children: analista }), _jsx("span", { className: "badge", children: list.length })] }), _jsx("div", { className: "card-b", style: { paddingTop: 0 }, children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "T\u00EDtulo" }), _jsx("th", { children: "Solicitante" }), _jsx("th", { children: "Status" }), _jsx("th", { style: { width: 90 }, children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { children: list.map(g => (_jsxs("tr", { children: [_jsx("td", { children: g.titulo }), _jsx("td", { children: g.solicitante.name }), _jsx("td", { children: _jsx("span", { className: "badge", children: statusTitle(g.status) }) }), _jsx("td", { children: _jsx(Link, { to: `/gmuds/${g.id}`, className: "btn", children: "Abrir" }) })] }, g.id))) })] }) })] }, analista))) }))] })] })] }));
}
