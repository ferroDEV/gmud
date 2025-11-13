import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { del, get, post } from "../lib/api";
export default function Recursos() {
    const [rows, setRows] = useState([]);
    const [nomeSel, setNomeSel] = useState(null);
    const [qNome, setQNome] = useState("");
    const [optsNome, setOptsNome] = useState([]);
    const [openNome, setOpenNome] = useState(false);
    const timer = useRef(null);
    const [tipo, setTipo] = useState("DESENVOLVEDOR");
    const [areaNegocio, setAreaNegocio] = useState("BI");
    const [err, setErr] = useState(null);
    const [saving, setSaving] = useState(false);
    // Áreas de negócio fixas
    const areasNegocioCat = ["BI", "PROTHEUS", "REQUISITOS", "WEB"].sort();
    const load = async () => {
        try {
            const data = await get("/api/recursos");
            // ordena por nome antes de exibir
            data.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
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
    // Busca de usuários para o campo Nome
    useEffect(() => {
        if (timer.current)
            clearTimeout(timer.current);
        if (!qNome) {
            setOptsNome([]);
            return;
        }
        timer.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(qNome)}`, { credentials: "include" });
                const data = await res.json();
                setOptsNome(data);
                setOpenNome(true);
            }
            catch {
                setOptsNome([]);
            }
        }, 300);
        return () => {
            if (timer.current)
                clearTimeout(timer.current);
        };
    }, [qNome]);
    const add = async () => {
        setErr(null);
        if (!nomeSel)
            return setErr("Selecione o usuário para o campo Nome.");
        if (!tipo)
            return setErr("Selecione o tipo.");
        if (!areaNegocio)
            return setErr("Selecione a área de negócio.");
        setSaving(true);
        try {
            await post("/api/recursos", {
                nome: nomeSel.name,
                tipo,
                areaNegocio,
            });
            setNomeSel(null);
            setQNome("");
            setTipo("DESENVOLVEDOR");
            setAreaNegocio("BI");
            load();
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
        if (!confirm("Excluir recurso?"))
            return;
        try {
            await del(`/api/recursos/${id}`);
            setRows(rows.filter((r) => r.id !== id));
        }
        catch (e) {
            const ae = e;
            setErr(ae.message || ae.error);
        }
    };
    return (_jsxs("div", { className: "grid", style: { gap: 16 }, children: [_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", children: [_jsx("strong", { children: "Recursos" }), _jsx("div", { className: "help", children: "Cadastro" })] }), _jsxs("div", { className: "card-b grid", style: { gap: 12 }, children: [err && _jsx("div", { className: "alert", children: err }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { style: { position: "relative" }, children: [_jsx("label", { children: "Nome" }), _jsx("input", { className: "input", placeholder: "Pesquisar usu\u00E1rio", value: nomeSel ? nomeSel.name : qNome, onChange: (e) => {
                                                    setNomeSel(null);
                                                    setQNome(e.target.value);
                                                }, onFocus: () => qNome && setOpenNome(true) }), openNome && optsNome.length > 0 && !nomeSel && (_jsx("div", { style: {
                                                    position: "absolute",
                                                    zIndex: 20,
                                                    top: "64px",
                                                    left: 0,
                                                    right: 0,
                                                    border: "1px solid var(--border)",
                                                    background: "var(--bg-2)",
                                                    borderRadius: 10,
                                                    maxHeight: 240,
                                                    overflowY: "auto",
                                                }, children: optsNome.map((u) => (_jsxs("div", { onClick: () => {
                                                        setNomeSel(u);
                                                        setOpenNome(false);
                                                    }, style: { padding: "8px 10px", cursor: "pointer" }, children: [_jsx("div", { style: { fontWeight: 600 }, children: u.name }), _jsx("div", { className: "help", children: u.area || "Sem área" })] }, u.id))) }))] }), _jsxs("div", { children: [_jsx("label", { children: "Tipo" }), _jsxs("select", { className: "input", value: tipo, onChange: (e) => setTipo(e.target.value), children: [_jsx("option", { value: "DESENVOLVEDOR", children: "DESENVOLVEDOR" }), _jsx("option", { value: "NEG\u00D3CIOS", children: "NEG\u00D3CIOS" })] })] }), _jsxs("div", { children: [_jsx("label", { children: "\u00C1rea de neg\u00F3cio" }), _jsx("select", { className: "input", value: areaNegocio, onChange: (e) => setAreaNegocio(e.target.value), children: areasNegocioCat.map((a) => (_jsx("option", { value: a, children: a }, a))) })] })] }), _jsx("div", { style: { display: "flex", gap: 8, justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: add, disabled: saving, children: saving ? "Salvando..." : "Salvar" }) })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsx("strong", { children: "Lista de Recursos" }) }), _jsx("div", { className: "card-b", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Nome" }), _jsx("th", { children: "Tipo" }), _jsx("th", { children: "\u00C1rea de neg\u00F3cio" }), _jsx("th", {})] }) }), _jsxs("tbody", { children: [rows.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: r.nome }), _jsx("td", { children: r.tipo }), _jsx("td", { children: r.areaNegocio }), _jsx("td", { children: _jsx("button", { className: "btn", onClick: () => remove(r.id), children: "Excluir" }) })] }, r.id))), rows.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "help", style: { textAlign: "center" }, children: "Nenhum recurso cadastrado" }) }))] })] }) })] })] }));
}
