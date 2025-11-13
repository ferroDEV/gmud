import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { post } from "../../lib/api";
import { useNavigate } from "react-router-dom";
export default function NovaSolicitacao() {
    const nav = useNavigate();
    const hoje = useMemo(() => new Date().toLocaleDateString(), []);
    // Solicitante (select-search)
    const [q, setQ] = useState("");
    const [opts, setOpts] = useState([]);
    const [open, setOpen] = useState(false);
    const [sel, setSel] = useState(null);
    // Campos principais
    const [area, setArea] = useState("");
    // ÁREAS ENVOLVIDAS — multi select-search
    const [areasCat, setAreasCat] = useState([]);
    const [qArea, setQArea] = useState("");
    const [optsAreas, setOptsAreas] = useState([]);
    const [openArea, setOpenArea] = useState(false);
    const [selAreas, setSelAreas] = useState([]);
    const addArea = (a) => {
        if (!selAreas.includes(a))
            setSelAreas((prev) => [...prev, a]);
        setOpenArea(false);
        setQArea("");
    };
    const removeArea = (a) => setSelAreas((prev) => prev.filter((x) => x !== a));
    // RESPONSÁVEIS/HOMOLOGADORES — multi select-search por usuário
    const [qResp, setQResp] = useState("");
    const [optsResp, setOptsResp] = useState([]);
    const [openResp, setOpenResp] = useState(false);
    const [selResp, setSelResp] = useState([]);
    const addResp = (u) => {
        if (!selResp.some((x) => x.id === u.id))
            setSelResp((prev) => [...prev, u]);
        setOpenResp(false);
        setQResp("");
        setOptsResp([]);
    };
    const removeResp = (id) => setSelResp((prev) => prev.filter((u) => u.id !== id));
    // Campos textuais
    const [onde, setOnde] = useState("");
    const [porque, setPorque] = useState("");
    const [processosAfetados, setProcessosAfetados] = useState("");
    const [processoAtual, setProcessoAtual] = useState("");
    const [impacto, setImpacto] = useState("Baixo");
    const [urgencia, setUrgencia] = useState("Baixa");
    const [justificativa, setJustificativa] = useState("");
    const [err, setErr] = useState(null);
    const [saving, setSaving] = useState(false);
    const needJust = impacto === "Alto" || urgencia === "Alta";
    // Carrega catálogo de áreas 1x e filtra pelo termo
    useEffect(() => {
        fetch("/api/areas", { credentials: "include" })
            .then((r) => r.json())
            .then((arr) => {
            setAreasCat(arr || []);
            setOptsAreas(arr || []);
        })
            .catch(() => {
            setAreasCat([]);
            setOptsAreas([]);
        });
    }, []);
    useEffect(() => {
        if (!qArea) {
            setOptsAreas(areasCat);
            return;
        }
        const ql = qArea.toLowerCase();
        setOptsAreas(areasCat.filter((a) => a.toLowerCase().includes(ql)));
    }, [qArea, areasCat]);
    // Busca de responsáveis por nome (debounced)
    useEffect(() => {
        if (!qResp) {
            setOptsResp([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(qResp)}`, { credentials: "include" });
                const data = await res.json();
                setOptsResp(data || []);
                setOpenResp(true);
            }
            catch {
                setOptsResp([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [qResp]);
    // Busca de solicitante (debounced)
    useEffect(() => {
        if (!q) {
            setOpts([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
                const data = await res.json();
                setOpts(data);
                setOpen(true);
            }
            catch {
                setOpts([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [q]);
    // Atualiza área conforme o usuário selecionado
    useEffect(() => {
        if (sel)
            setArea(sel.area || "");
    }, [sel]);
    const save = async () => {
        setErr(null);
        if (!sel)
            return setErr("Selecione o solicitante.");
        if (!selAreas.length)
            return setErr("Selecione ao menos uma área envolvida.");
        if (!selResp.length)
            return setErr("Selecione ao menos um responsável/homologador.");
        if (needJust && !justificativa.trim())
            return setErr("Informe a justificativa para impacto/urgência altos.");
        // título derivado
        const base = porque.trim() || onde.trim() || "Solicitação";
        const titulo = base.substring(0, 80);
        const form = {
            data: hoje,
            areasEnvolvidas: selAreas, // array de áreas
            responsaveis: selResp.map((u) => ({ id: u.id, name: u.name, area: u.area })), // array de usuários
            onde,
            porque,
            processosAfetados,
            processoAtual,
            impacto,
            urgencia,
            justificativa: needJust ? justificativa : "",
        };
        setSaving(true);
        try {
            const areaPrincipal = selAreas[0];
            const res = await post("/api/solicitacoes", {
                titulo,
                area: areaPrincipal,
                solicitanteId: sel.id, // solicitante correto
                form,
            });
            nav(`/solicitacoes/${res.id}`);
        }
        catch (e) {
            const ae = e;
            setErr(ae.message || ae.error || "Erro ao salvar");
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("div", { className: "grid", style: { gap: 16 }, children: _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", children: [_jsx("strong", { children: "Solicita\u00E7\u00E3o de GMUD" }), _jsx("div", { className: "help", children: "Cadastro" })] }), _jsxs("div", { className: "card-b grid", style: { gap: 12 }, children: [err && _jsx("div", { className: "alert", children: err }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { children: [_jsx("label", { children: "Data" }), _jsx("input", { className: "input", value: hoje, readOnly: true })] }), _jsxs("div", { style: { position: "relative" }, children: [_jsx("label", { children: "Solicitante" }), _jsx("input", { className: "input", placeholder: "Pesquisar usu\u00E1rio", value: sel ? sel.name : q, onChange: (e) => {
                                                setSel(null);
                                                setQ(e.target.value);
                                            }, onFocus: () => q && setOpen(true) }), open && opts.length > 0 && !sel && (_jsx("div", { style: {
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
                                            }, children: opts.map((u) => (_jsxs("div", { onClick: () => {
                                                    setSel(u);
                                                    setOpen(false);
                                                }, style: { padding: "8px 10px", cursor: "pointer" }, children: [_jsx("div", { style: { fontWeight: 600 }, children: u.name }), _jsx("div", { className: "help", children: u.area || "Sem área" })] }, `${u.id || u.name}-${u.area}`))) }))] }), _jsxs("div", { children: [_jsx("label", { children: "\u00C1rea" }), _jsx("input", { className: "input", value: area, readOnly: true })] })] }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { style: { gridColumn: "1 / -1" }, children: [_jsx("label", { children: "Onde ser\u00E1 feito?" }), _jsx("textarea", { className: "input", rows: 3, value: onde, onChange: (e) => setOnde(e.target.value) })] }), _jsxs("div", { style: { gridColumn: "1 / -1" }, children: [_jsx("label", { children: "Por que ser\u00E1 feito?" }), _jsx("textarea", { className: "input", rows: 3, value: porque, onChange: (e) => setPorque(e.target.value) })] }), _jsxs("div", { style: { gridColumn: "1 / -1" }, children: [_jsx("label", { children: "Quais as \u00E1reas envolvidas nessa solicita\u00E7\u00E3o?" }), _jsxs("div", { className: "grid", style: { gap: 8 }, children: [_jsx("input", { className: "input", placeholder: "Buscar \u00E1rea", value: qArea, onChange: (e) => setQArea(e.target.value), onFocus: () => setOpenArea(true) }), openArea && optsAreas.length > 0 && (_jsx("div", { style: {
                                                        border: "1px solid var(--border)",
                                                        background: "var(--bg-2)",
                                                        borderRadius: 10,
                                                        maxHeight: 260,
                                                        overflowY: "auto",
                                                    }, children: optsAreas.map((a) => (_jsx("div", { style: { padding: "8px 10px", cursor: "pointer" }, onClick: () => addArea(a), children: a }, a))) })), _jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: selAreas.map((a) => (_jsxs("span", { className: "badge", style: { display: "inline-flex", gap: 6 }, children: [a, _jsx("button", { className: "btn icon", onClick: () => removeArea(a), "aria-label": "remover", children: "\u2715" })] }, a))) })] })] }), _jsxs("div", { style: { gridColumn: "1 / -1" }, children: [_jsx("label", { children: "Quais processos ser\u00E3o afetados?" }), _jsx("textarea", { className: "input", rows: 3, value: processosAfetados, onChange: (e) => setProcessosAfetados(e.target.value) })] }), _jsxs("div", { style: { gridColumn: "1 / -1" }, children: [_jsx("label", { children: "O processo \u00E9 feito atualmente de que forma?" }), _jsx("textarea", { className: "input", rows: 3, value: processoAtual, onChange: (e) => setProcessoAtual(e.target.value) })] }), _jsxs("div", { style: { gridColumn: "1 / -1" }, children: [_jsx("label", { children: "Quem ser\u00E3o os respons\u00E1veis pelas regras e pela homologa\u00E7\u00E3o?" }), _jsxs("div", { className: "grid", style: { gap: 8 }, children: [_jsx("input", { className: "input", placeholder: "Buscar usu\u00E1rio por nome", value: qResp, onChange: (e) => setQResp(e.target.value), onFocus: () => qResp && setOpenResp(true) }), openResp && optsResp.length > 0 && (_jsx("div", { style: {
                                                        border: "1px solid var(--border)",
                                                        background: "var(--bg-2)",
                                                        borderRadius: 10,
                                                        maxHeight: 260,
                                                        overflowY: "auto",
                                                    }, children: optsResp.map((u) => (_jsxs("div", { style: { padding: "8px 10px", cursor: "pointer" }, onClick: () => addResp(u), children: [_jsx("div", { style: { fontWeight: 600 }, children: u.name }), _jsx("div", { className: "help", children: u.area || "Sem área" })] }, `${u.id || u.name}-${u.area}`))) })), _jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: selResp.map((u) => (_jsxs("span", { className: "badge", style: { display: "inline-flex", gap: 6 }, children: [u.name, " \u00B7 ", u.area, _jsx("button", { className: "btn icon", onClick: () => removeResp(u.id), "aria-label": "remover", children: "\u2715" })] }, `${u.id || u.name}-${u.area}`))) })] })] })] }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { children: [_jsx("label", { children: "Impacto" }), _jsxs("select", { className: "input", value: impacto, onChange: (e) => setImpacto(e.target.value), children: [_jsx("option", { value: "Alto", children: "Alto" }), _jsx("option", { value: "M\u00E9dio", children: "M\u00E9dio" }), _jsx("option", { value: "Baixo", children: "Baixo" })] })] }), _jsxs("div", { children: [_jsx("label", { children: "Urg\u00EAncia" }), _jsxs("select", { className: "input", value: urgencia, onChange: (e) => setUrgencia(e.target.value), children: [_jsx("option", { value: "Alta", children: "Alta" }), _jsx("option", { value: "M\u00E9dia", children: "M\u00E9dia" }), _jsx("option", { value: "Baixa", children: "Baixa" })] })] }), _jsx("div", {})] }), needJust && (_jsxs("div", { children: [_jsx("label", { children: "Justificativa" }), _jsx("textarea", { className: "input", rows: 3, value: justificativa, onChange: (e) => setJustificativa(e.target.value) })] })), _jsxs("div", { style: { display: "flex", gap: 8, justifyContent: "end" }, children: [_jsx("button", { className: "btn", type: "button", onClick: () => nav("/solicitacoes"), children: "Cancelar" }), _jsx("button", { type: "button", className: "btn accent", onClick: (e) => {
                                        e.preventDefault();
                                        save();
                                    }, disabled: saving, children: saving ? "Salvando..." : "Salvar" })] })] })] }) }));
}
