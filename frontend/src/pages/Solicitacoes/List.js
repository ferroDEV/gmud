import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { get } from "../../lib/api";
import { Link, useNavigate } from "react-router-dom";
const statusTitle = (i) => {
    const map = { 1: "Análise de prioridade", 2: "Agendamento de entrevistas", 3: "Aprovação de processos", 4: "Formalização de requisitos", 5: "Aprovação de requisitos" };
    return map[i] || `Status ${i}`;
};
export default function ListSolicitacoes() {
    const [rows, setRows] = useState([]);
    const [err, setErr] = useState(null);
    const [groupByAnalista, setGroup] = useState(true);
    const navigate = useNavigate();
    const load = () => {
        get("/api/solicitacoes")
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
        for (const s of rows) {
            const key = s.analistaRequisitos?.name || "Sem analista";
            (idx[key] || (idx[key] = [])).push(s);
        }
        return idx;
    }, [groupByAnalista, rows]);
    return (_jsxs("div", { className: "grid", style: { gap: 12 }, children: [_jsxs("div", { className: "topbar", children: [_jsx("input", { className: "input", style: { maxWidth: 320 }, placeholder: "Buscar por t\u00EDtulo ou \u00E1rea" }), _jsx("div", { style: { marginLeft: "auto" } }), _jsx("button", { className: "btn primary", onClick: () => navigate("/solicitacoes/nova"), children: "Nova" })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("strong", { children: "Solicita\u00E7\u00F5es" }), _jsxs("label", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("input", { type: "checkbox", checked: groupByAnalista, onChange: e => setGroup(e.target.checked) }), "Agrupar por Analista de Requisitos"] })] }), _jsxs("div", { className: "card-b", children: [err && _jsx("div", { className: "alert", style: { marginBottom: 8 }, children: err }), !groupByAnalista ? (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "T\u00EDtulo" }), _jsx("th", { children: "\u00C1rea" }), _jsx("th", { children: "Solicitante" }), _jsx("th", { children: "Analista" }), _jsx("th", { children: "Status" }), _jsx("th", { style: { width: 90 }, children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { children: rows.map(s => (_jsxs("tr", { children: [_jsx("td", { children: s.titulo }), _jsx("td", { children: s.area }), _jsx("td", { children: s.solicitante.name }), _jsx("td", { children: s.analistaRequisitos?.name || "—" }), _jsx("td", { children: _jsx("span", { className: "badge", children: statusTitle(s.status) }) }), _jsx("td", { children: _jsx(Link, { to: `/solicitacoes/${s.id}`, className: "btn", children: "Abrir" }) })] }, s.id))) })] })) : (_jsx("div", { className: "grid", style: { gap: 10 }, children: Object.entries(grouped || {}).map(([analista, list]) => (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", children: [_jsx("strong", { children: analista }), _jsx("span", { className: "badge", children: list.length })] }), _jsx("div", { className: "card-b", style: { paddingTop: 0 }, children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "T\u00EDtulo" }), _jsx("th", { children: "\u00C1rea" }), _jsx("th", { children: "Solicitante" }), _jsx("th", { children: "Status" }), _jsx("th", { style: { width: 90 }, children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { children: list.map(s => (_jsxs("tr", { children: [_jsx("td", { children: s.titulo }), _jsx("td", { children: s.area }), _jsx("td", { children: s.solicitante.name }), _jsx("td", { children: _jsx("span", { className: "badge", children: statusTitle(s.status) }) }), _jsx("td", { children: _jsx(Link, { to: `/solicitacoes/${s.id}`, className: "btn", children: "Abrir" }) })] }, s.id))) })] }) })] }, analista))) }))] })] })] }));
}
