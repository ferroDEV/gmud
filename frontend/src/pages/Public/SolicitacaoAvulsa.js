import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { post } from "../../lib/api";
import { useNavigate } from "react-router-dom";
export default function SolicitacaoAvulsa() {
    const [f, setF] = useState({ titulo: "", area: "", solicitanteId: 1, analistaRequisitosId: undefined });
    const [err, setErr] = useState(null);
    const nav = useNavigate();
    const save = async () => {
        try {
            await post("/api/solicitacoes", f);
            alert("Solicitação cadastrada. Entre no sistema para acompanhar.");
            nav("/login");
        }
        catch (e) {
            const ae = e;
            setErr(ae.message || "Erro ao salvar");
        }
    };
    return (_jsx("div", { style: { minHeight: "100vh", display: "grid", placeItems: "center" }, children: _jsxs("div", { className: "card", style: { width: 640, maxWidth: "94vw" }, children: [_jsxs("div", { className: "card-h", children: [_jsx("strong", { children: "Solicita\u00E7\u00E3o de GMUD" }), _jsx("div", { className: "help", children: "Tela p\u00FAblica avulsa" })] }), _jsxs("div", { className: "card-b grid grid-2", children: [err && _jsx("div", { className: "alert", style: { gridColumn: "1 / -1" }, children: err }), _jsxs("div", { children: [_jsx("label", { children: "T\u00EDtulo" }), _jsx("input", { className: "input", value: f.titulo, onChange: e => setF({ ...f, titulo: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { children: "\u00C1rea" }), _jsx("input", { className: "input", value: f.area, onChange: e => setF({ ...f, area: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { children: "ID do Solicitante" }), _jsx("input", { className: "input", type: "number", value: f.solicitanteId, onChange: e => setF({ ...f, solicitanteId: parseInt(e.target.value || '1', 10) }) })] }), _jsxs("div", { children: [_jsx("label", { children: "ID Analista Requisitos (opcional)" }), _jsx("input", { className: "input", type: "number", value: f.analistaRequisitosId || '', onChange: e => setF({ ...f, analistaRequisitosId: e.target.value ? parseInt(e.target.value, 10) : undefined }) })] }), _jsxs("div", { style: { gridColumn: "1 / -1", display: "flex", justifyContent: "end", gap: 8 }, children: [_jsx("button", { className: "btn", onClick: () => nav("/login"), children: "Voltar" }), _jsx("button", { className: "btn accent", onClick: save, children: "Salvar" })] })] })] }) }));
}
