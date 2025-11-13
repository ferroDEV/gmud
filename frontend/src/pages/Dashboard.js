import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { get } from "../lib/api";
import Sparkline from "../components/charts/Sparkline";
import Bars from "../components/charts/Bars";
import Donut from "../components/charts/Donut";
import { toast } from "../components/Toast";
export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [err, setErr] = useState(null);
    useEffect(() => {
        get("/api/meta/metrics").then(setMetrics).catch((e) => {
            setErr(e?.message || "Falha ao carregar métricas");
            toast("Erro ao carregar métricas");
        });
    }, []);
    const line = [12, 18, 10, 22, 17, 28, 24, 30];
    const bars = [22, 40, 31, 55, 44];
    const pie = [
        { label: "Concluídas", value: 18, color: "#16a34a" },
        { label: "Em andamento", value: 9, color: "#2563eb" },
        { label: "Pendentes", value: 4, color: "#f59e0b" },
    ];
    return (_jsxs("div", { className: "grid", style: { gap: 16 }, children: [_jsxs("div", { className: "grid grid-3", children: [_jsx(KPI, { title: "Solicita\u00E7\u00F5es", value: metrics?.solicitacoes ?? 0 }), _jsx(KPI, { title: "GMUDs", value: metrics?.gmuds ?? 0 }), _jsx(KPI, { title: "Recursos", value: metrics?.recursos ?? 0 })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", children: [_jsx("strong", { children: "Indicadores" }), _jsx("div", { className: "help", children: "Exemplos em SVG" })] }), _jsxs("div", { className: "card-b grid grid-3", children: [_jsxs("div", { children: [_jsx("div", { className: "help", style: { marginBottom: 6 }, children: "Throughput semanal" }), _jsx(Sparkline, { data: line })] }), _jsxs("div", { children: [_jsx("div", { className: "help", style: { marginBottom: 6 }, children: "Tempo m\u00E9dio at\u00E9 Go Live" }), _jsx(Bars, { data: bars })] }), _jsxs("div", { children: [_jsx("div", { className: "help", style: { marginBottom: 6 }, children: "Distribui\u00E7\u00E3o de status" }), _jsx(Donut, { data: pie })] })] }), err && _jsx("div", { className: "card-b", children: _jsx("div", { className: "alert", children: err }) })] })] }));
}
function KPI({ title, value }) {
    return (_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: title }), _jsx("div", { className: "card-b", children: _jsx("div", { style: { fontSize: 28, fontWeight: 700 }, children: value }) })] }));
}
