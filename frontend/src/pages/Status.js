import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { del, get, post } from "../lib/api";
export default function Status() {
    const [rows, setRows] = useState([]);
    const [nome, setNome] = useState("");
    const [ordem, setOrdem] = useState("");
    const [tipo, setTipo] = useState("SOLICITAÇÃO");
    const [err, setErr] = useState(null);
    const [saving, setSaving] = useState(false);
    const load = async () => {
        try {
            const data = await get("/api/status");
            data.sort((a, b) => {
                if (a.tipo === b.tipo)
                    return a.ordem - b.ordem;
                return a.tipo.localeCompare(b.tipo, "pt-BR");
            });
            setRows(data);
        }
        catch (e) {
            const ae = e;
            setErr(ae.message || ae.error);
        }
    };
    useEffect(() => {
        load();
    }, []);
    const add = async () => {
        setErr(null);
        if (!nome.trim())
            return setErr("Informe o nome do status.");
        if (!ordem)
            return setErr("Informe a ordem.");
        if (!tipo)
            return setErr("Selecione o tipo.");
        setSaving(true);
        try {
            await post("/api/status", {
                nome,
                ordem: Number(ordem),
                tipo,
            });
            setNome("");
            setOrdem("");
            setTipo("SOLICITAÇÃO");
            await load();
        }
        catch (e) {
            const ae = e;
            setErr(ae.message || ae.error || "Erro ao salvar");
        }
        finally {
            setSaving(false);
        }
    };
    const remove = async (id) => {
        if (!confirm("Excluir este status?"))
            return;
        try {
            await del(`/api/status/${id}`);
            setRows(rows.filter((r) => r.id !== id));
        }
        catch (e) {
            const ae = e;
            setErr(ae.message || ae.error);
        }
    };
    return (_jsxs("div", { className: "grid", style: { gap: 16 }, children: [_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", children: [_jsx("strong", { children: "Status" }), _jsx("div", { className: "help", children: "Cadastro" })] }), _jsxs("div", { className: "card-b grid", style: { gap: 12 }, children: [err && _jsx("div", { className: "alert", children: err }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { children: [_jsx("label", { children: "Nome" }), _jsx("input", { className: "input", placeholder: "Nome do status", value: nome, onChange: (e) => setNome(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { children: "Ordem" }), _jsx("input", { className: "input", type: "number", placeholder: "Ordem", value: ordem, onChange: (e) => setOrdem(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { children: "Tipo" }), _jsxs("select", { className: "input", value: tipo, onChange: (e) => setTipo(e.target.value), children: [_jsx("option", { value: "SOLICITA\u00C7\u00C3O", children: "SOLICITA\u00C7\u00C3O" }), _jsx("option", { value: "GMUD", children: "GMUD" })] })] })] }), _jsx("div", { style: { display: "flex", gap: 8, justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: add, disabled: saving, children: saving ? "Salvando..." : "Salvar" }) })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsx("strong", { children: "Lista de Status" }) }), _jsx("div", { className: "card-b", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Nome" }), _jsx("th", { children: "Ordem" }), _jsx("th", { children: "Tipo" }), _jsx("th", {})] }) }), _jsxs("tbody", { children: [rows.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: r.nome }), _jsx("td", { children: r.ordem }), _jsx("td", { children: r.tipo }), _jsx("td", { children: _jsx("button", { className: "btn", onClick: () => remove(r.id), children: "Excluir" }) })] }, r.id))), rows.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "help", style: { textAlign: "center" }, children: "Nenhum status cadastrado" }) }))] })] }) })] })] }));
}
