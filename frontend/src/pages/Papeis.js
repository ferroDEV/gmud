import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { del, get, post } from "../lib/api";
export default function Papeis() {
    const [rows, setRows] = useState([]);
    const [nome, setNome] = useState("");
    const [err, setErr] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    // select-search cargos
    const [qCargo, setQCargo] = useState("");
    const [optsCargo, setOptsCargo] = useState([]);
    const [openCargo, setOpenCargo] = useState(false);
    const [selCargos, setSelCargos] = useState([]);
    const timer = useRef(null);
    const load = async () => {
        try {
            const data = await get("/api/papeis");
            // ordena por nome
            data.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
            setRows(data);
        }
        catch (e) {
            const ae = e;
            setErr(ae.message || ae.error);
        }
    };
    useEffect(() => { load(); }, []);
    // busca cargos no servidor (SQL Server)
    useEffect(() => {
        if (timer.current)
            clearTimeout(timer.current);
        if (!qCargo) {
            setOptsCargo([]);
            return;
        }
        timer.current = setTimeout(async () => {
            try {
                const r = await fetch(`/api/cargos?q=${encodeURIComponent(qCargo)}`, { credentials: "include" });
                const data = await r.json();
                setOptsCargo(data);
                setOpenCargo(true);
            }
            catch {
                setOptsCargo([]);
            }
        }, 300);
        return () => { if (timer.current)
            clearTimeout(timer.current); };
    }, [qCargo]);
    const addCargo = (c) => {
        if (!selCargos.some(s => s.id === c.id))
            setSelCargos(prev => [...prev, c]);
        setOpenCargo(false);
        setQCargo("");
        setOptsCargo([]);
    };
    const removeCargo = (id) => setSelCargos(prev => prev.filter(c => c.id !== id));
    const add = async () => {
        setErr(null);
        if (!nome.trim())
            return setErr("Informe o nome do papel.");
        setSaving(true);
        try {
            if (editId === null) {
                // criar
                await post("/api/papeis", {
                    nome,
                    cargos: selCargos, // [{id,nome}]
                });
            }
            else {
                // editar
                await fetch(`/api/papeis/${editId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        nome,
                        cargos: selCargos, // [{id,nome}]
                    }),
                }).then(async (r) => {
                    if (!r.ok)
                        throw await r.json();
                });
            }
            setNome("");
            setSelCargos([]);
            setEditId(null);
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
        if (!confirm("Excluir este papel? Os vínculos de cargos serão removidos."))
            return;
        try {
            await del(`/api/papeis/${id}`);
            setRows(rows.filter(r => r.id !== id));
        }
        catch (e) {
            const ae = e;
            setErr(ae.message || ae.error);
        }
    };
    return (_jsxs("div", { className: "grid", style: { gap: 16 }, children: [_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", children: [_jsx("strong", { children: "Pap\u00E9is" }), _jsx("div", { className: "help", children: "Cadastro" })] }), _jsxs("div", { className: "card-b grid", style: { gap: 12 }, children: [err && _jsx("div", { className: "alert", children: err }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { children: [_jsx("label", { children: "Nome do papel" }), _jsx("input", { className: "input", value: nome, onChange: (e) => setNome(e.target.value), placeholder: "Ex.: REQUISITOS, ANALISTA, ADMIN..." })] }), _jsxs("div", { className: "col-span-2", style: { position: "relative" }, children: [_jsx("label", { children: "Cargo(s)" }), _jsx("input", { className: "input", placeholder: "Buscar cargo", value: qCargo, onChange: (e) => setQCargo(e.target.value), onFocus: () => qCargo && setOpenCargo(true) }), openCargo && optsCargo.length > 0 && (_jsx("div", { style: {
                                                    position: "absolute",
                                                    zIndex: 20,
                                                    top: "64px",
                                                    left: 0,
                                                    right: 0,
                                                    border: "1px solid var(--border)",
                                                    background: "var(--bg-2)",
                                                    borderRadius: 10,
                                                    maxHeight: 260,
                                                    overflowY: "auto",
                                                }, children: optsCargo.map((c) => (_jsxs("div", { onClick: () => addCargo(c), style: { padding: "8px 10px", cursor: "pointer" }, children: [c.nome, _jsx("div", { className: "help", children: c.area || "Sem área" })] }, c.id))) })), _jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }, children: selCargos.map((c) => (_jsxs("span", { className: "badge", style: { display: "inline-flex", gap: 6 }, children: [c.nome, _jsx("button", { className: "btn icon", onClick: () => removeCargo(c.id), "aria-label": "remover", children: "\u2715" })] }, c.id))) })] })] }), _jsxs("div", { style: { display: "flex", gap: 8, justifyContent: "end" }, children: [editId !== null && (_jsx("button", { className: "btn", onClick: () => {
                                            setEditId(null);
                                            setNome("");
                                            setSelCargos([]);
                                        }, disabled: saving, children: "Cancelar" })), _jsx("button", { className: "btn accent", onClick: add, disabled: saving, children: saving ? "Salvando..." : editId === null ? "Salvar" : "Atualizar" })] })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsx("strong", { children: "Lista de Pap\u00E9is" }) }), _jsx("div", { className: "card-b", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Papel" }), _jsx("th", { children: "Cargo" }), _jsx("th", {})] }) }), _jsxs("tbody", { children: [rows.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: r.nome }), _jsx("td", { children: r.cargos?.map(c => c.cargoNome).sort((a, b) => a.localeCompare(b, "pt-BR")).join(", ") || "-" }), _jsx("td", { children: _jsxs("div", { style: { display: "flex", gap: 8 }, children: [_jsx("button", { className: "btn", onClick: () => {
                                                                    // habilita modo edição carregando o formulário com os dados da linha
                                                                    setEditId(r.id);
                                                                    setNome(r.nome);
                                                                    setSelCargos((r.cargos || []).map(c => ({ id: c.cargoId, nome: c.cargoNome })));
                                                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                                                }, children: "Editar" }), _jsx("button", { className: "btn", onClick: () => remove(r.id), children: "Excluir" })] }) })] }, r.id))), rows.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "help", style: { textAlign: "center" }, children: "Nenhum papel cadastrado" }) }))] })] }) })] })] }));
}
