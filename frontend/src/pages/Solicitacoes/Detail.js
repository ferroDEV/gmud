import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { get, post } from "../../lib/api";
import { useParams } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { toast } from "../../components/Toast";
export default function DetalheSolicitacao() {
    const { id } = useParams();
    const { user } = useAuth();
    const [row, setRow] = useState(null);
    const [err, setErr] = useState(null);
    const [tab, setTab] = useState(1);
    const load = () => {
        get(`/api/solicitacoes/${id}`).then((r) => {
            setRow(r);
            const reached = (r?.tracks || []).map((t) => t.ordem);
            setTab(reached.length ? reached[reached.length - 1] : r.status || 1);
        }).catch((e) => setErr(e.message || e.error));
    };
    useEffect(() => { load(); }, [id]);
    if (err)
        return _jsx("div", { className: "alert", children: err });
    if (!row)
        return _jsx("div", { className: "help", children: "Carregando..." });
    const canEdit = (requiredRole) => user?.role === requiredRole || user?.role === "ADMIN";
    return (_jsxs("div", { className: "grid", style: { gap: 16 }, children: [_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-h", children: [_jsxs("strong", { children: ["Solicita\u00E7\u00E3o #", row.id, " \u2014 ", row.titulo] }), _jsxs("div", { className: "help", children: ["Criada em ", new Date(row.createdAt).toLocaleString()] })] }), _jsxs("div", { className: "card-b grid grid-3", children: [_jsx(Info, { label: "\u00C1rea", value: row.area }), _jsx(Info, { label: "Solicitante", value: row.solicitante?.name }), _jsx(Info, { label: "Analista Requisitos", value: row.analistaRequisitos?.name || "—" }), _jsxs("div", { style: { gridColumn: "1 / -1", display: "flex", gap: 8, flexWrap: "wrap" }, children: [_jsx("button", { className: "btn", onClick: async () => {
                                            const valor = prompt("Novo ID do solicitante:");
                                            if (!valor)
                                                return;
                                            await post(`/api/solicitacoes/${row.id}/assign`, { solicitanteId: Number(valor) });
                                            toast("Solicitante alterado");
                                            load();
                                        }, children: "ALTERAR SOLICITANTE" }), _jsx("button", { className: "btn", onClick: async () => {
                                            const valor = prompt("Novo ID do desenvolvedor (Recurso):");
                                            if (!valor)
                                                return;
                                            await post(`/api/solicitacoes/${row.id}/assign`, { desenvolvedorId: Number(valor) });
                                            toast("Desenvolvedor alterado");
                                            load();
                                        }, children: "ALTERAR DESENVOLVEDOR" }), _jsx("button", { className: "btn", onClick: async () => {
                                            const valor = prompt("Novo ID do Analista de Requisitos:");
                                            if (!valor)
                                                return;
                                            await post(`/api/solicitacoes/${row.id}/assign`, { analistaRequisitosId: Number(valor) });
                                            toast("Analista de Requisitos alterado");
                                            load();
                                        }, children: "ALTERAR ANALISTA REQUISITOS" }), _jsx("button", { className: "btn destructive", onClick: async () => {
                                            const motivo = prompt("Motivo do cancelamento:\n1) Solicitação duplicada\n2) Mudança de prioridade\n3) Escopo incorreto");
                                            if (!motivo)
                                                return;
                                            await post(`/api/solicitacoes/${row.id}/cancel`, { motivo });
                                            toast("Solicitação cancelada");
                                            load();
                                        }, children: "CANCELAR SOLICITA\u00C7\u00C3O" })] })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsx("strong", { children: "Fluxo \u2014 Tipo SOLICITA\u00C7\u00C3O" }) }), _jsxs("div", { className: "card-b", children: [_jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }, children: [(row.tracks || []).map((t) => (_jsx("button", { className: "btn", onClick: () => setTab(t.ordem), style: { fontWeight: tab === t.ordem ? 700 : 500 }, children: t.ordem }, t.id))), !row.tracks?.length && _jsxs("span", { className: "help", children: ["Status atual: ", row.status] })] }), tab === 1 && _jsx(Status1, { solicitacaoId: row.id, canEdit: canEdit("REQUISITOS"), onSaved: () => { toast("Status 1 salvo"); load(); } }), tab === 2 && _jsx(Status2, { solicitacaoId: row.id, canEdit: canEdit("REQUISITOS"), onSaved: () => { toast("Status 2 salvo"); load(); } }), tab === 3 && _jsx(Status3, { solicitacaoId: row.id, canEdit: canEdit("PROCESSOS"), onSaved: () => { load(); } }), tab === 4 && _jsx(Status4, { solicitacaoId: row.id, canEdit: canEdit("REQUISITOS"), onSaved: () => { toast("Status 4 salvo"); load(); } }), tab === 5 && _jsx(Status5, { solicitacaoId: row.id, canEdit: canEdit("SOLICITANTE"), onSaved: () => { load(); } }), tab > 5 && _jsx("div", { className: "help", children: "Finalizada (6)" })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsx("strong", { children: "Acompanhamento" }) }), _jsxs("div", { className: "card-b grid", style: { gap: 8 }, children: [_jsxs("div", { className: "grid", style: { gridTemplateColumns: "auto 1fr", gap: 8 }, children: [row.logs.map((l) => (_jsxs(React.Fragment, { children: [_jsx("span", { className: "badge", children: new Date(l.ts).toLocaleString() }), _jsxs("div", { className: "help", children: [_jsx("b", { children: l.user }), " \u2014 ", l.acao] })] }, l.id))), !row.logs.length && _jsx("div", { className: "help", children: "Sem registros" })] }), _jsx(Observacao, { solicitacaoId: row.id, onSaved: () => { toast("Observação registrada"); load(); } })] })] })] }));
}
function Info({ label, value }) {
    return _jsx("div", { className: "card", children: _jsxs("div", { className: "card-b", children: [_jsx("div", { className: "help", children: label }), _jsx("div", { style: { fontWeight: 600 }, children: value })] }) });
}
// ====== Forms por status ======
function Status1({ solicitacaoId, canEdit, onSaved }) {
    const [devs, setDevs] = useState([]);
    const [reqs, setReqs] = useState([]);
    const [devIds, setDevIds] = useState([]);
    const [reqId, setReqId] = useState(null);
    const [pespro, setPespro] = useState("Baixo");
    const [pint, setPint] = useState("Baixo");
    const [err, setErr] = useState(null);
    // carrega desenvolvedores e analistas de requisitos (Negócios)
    useEffect(() => {
        get("/api/recursos?tipo=Desenvolvedor")
            .then(setDevs)
            .catch(() => setDevs([]));
        get("/api/recursos?tipo=Negócios")
            .then(setReqs)
            .catch(() => setReqs([]));
    }, []);
    const toggleDev = (id) => {
        setDevIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };
    const selectReq = (id) => {
        setReqId((prev) => (prev === id ? null : id)); // só um pode ser selecionado
    };
    const save = async () => {
        setErr(null);
        try {
            if (!devIds.length)
                return setErr("Selecione ao menos um desenvolvedor.");
            if (!reqId)
                return setErr("Selecione o analista de requisitos.");
            await post(`/api/solicitacoes/${solicitacaoId}/form/1`, {
                desenvolvedorIds: devIds,
                requisitosId: reqId,
                prioridadeEspro: pespro,
                prioridadeInterna: pint,
            });
            onSaved();
        }
        catch (e) {
            setErr(e.message || "Erro ao salvar status 1.");
        }
    };
    return (_jsxs("div", { className: "grid", style: { gap: 12 }, children: [err && _jsx("div", { className: "alert", children: err }), _jsxs("div", { style: { gridColumn: "1 / -1" }, children: [_jsx("label", { children: "Desenvolvedores" }), _jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [devs.map((d) => (_jsxs("label", { className: "badge", style: { cursor: "pointer", userSelect: "none" }, children: [_jsx("input", { type: "checkbox", checked: devIds.includes(d.id), onChange: () => toggleDev(d.id), disabled: !canEdit }), _jsx("span", { style: { marginLeft: 6 }, children: d.nome })] }, d.id))), !devs.length && _jsx("span", { className: "help", children: "Nenhum desenvolvedor dispon\u00EDvel." })] })] }), _jsxs("div", { style: { gridColumn: "1 / -1", marginTop: 8 }, children: [_jsx("label", { children: "Analista de Requisitos" }), _jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [reqs.map((r) => (_jsxs("label", { className: "badge", style: { cursor: "pointer", userSelect: "none" }, children: [_jsx("input", { type: "radio", name: "analistaRequisito", checked: reqId === r.id, onChange: () => selectReq(r.id), disabled: !canEdit }), _jsx("span", { style: { marginLeft: 6 }, children: r.nome })] }, r.id))), !reqs.length && _jsx("span", { className: "help", children: "Nenhum analista dispon\u00EDvel." })] })] }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { children: [_jsx("label", { children: "Prioridade Espro" }), _jsx("select", { className: "input", value: pespro, onChange: (e) => setPespro(e.target.value), disabled: !canEdit, children: ["Baixo", "Média", "Alta", "Urgente"].map((x) => (_jsx("option", { value: x, children: x }, x))) })] }), _jsxs("div", { children: [_jsx("label", { children: "Prioridade Interna" }), _jsx("select", { className: "input", value: pint, onChange: (e) => setPint(e.target.value), disabled: !canEdit, children: ["Baixo", "Média", "Alta", "Urgente"].map((x) => (_jsx("option", { value: x, children: x }, x))) })] })] }), canEdit && (_jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: save, children: "Salvar" }) }))] }));
}
function Status2({ solicitacaoId, canEdit, onSaved }) {
    const [data, setData] = useState("");
    const [tempo, setTempo] = useState("");
    const [files, setFiles] = useState(null);
    const [err, setErr] = useState(null);
    const save = async () => {
        setErr(null);
        try {
            const fd = new FormData();
            if (files)
                Array.from(files).forEach(f => fd.append("files", f));
            await fetch(`/api/solicitacoes/${solicitacaoId}/upload?ordem=2`, { method: "POST", body: fd, credentials: "include" }).then(async (r) => { if (!r.ok)
                throw await r.json(); });
            await post(`/api/solicitacoes/${solicitacaoId}/form/2`, { dataInicialEntrevista: data, tempoGastoEntrevista: tempo });
            onSaved();
        }
        catch (e) {
            setErr(e.message || "Erro");
        }
    };
    return _jsxs("div", { className: "grid", style: { gap: 12 }, children: [err && _jsx("div", { className: "alert", children: err }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { children: [_jsx("label", { children: "Data Inicial Entrevista" }), _jsx("input", { className: "input", type: "date", value: data, onChange: e => setData(e.target.value), disabled: !canEdit })] }), _jsxs("div", { children: [_jsx("label", { children: "Tempo Gasto com Entrevista" }), _jsx("input", { className: "input", type: "time", value: tempo, onChange: e => setTempo(e.target.value), disabled: !canEdit })] }), _jsx("div", {})] }), _jsxs("div", { children: [_jsx("label", { children: "Arquivos" }), _jsx("input", { className: "input", type: "file", multiple: true, onChange: e => setFiles(e.target.files), disabled: !canEdit })] }), canEdit && _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: save, children: "Salvar" }) })] });
}
function Status3({ solicitacaoId, canEdit, onSaved }) {
    const [obs, setObs] = useState("");
    const [err, setErr] = useState(null);
    const send = async (decisao) => {
        setErr(null);
        try {
            await post(`/api/solicitacoes/${solicitacaoId}/form/3`, { observacoes: obs, decisao });
            onSaved();
        }
        catch (e) {
            setErr(e.message || "Erro");
        }
    };
    return _jsxs("div", { className: "grid", style: { gap: 12 }, children: [err && _jsx("div", { className: "alert", children: err }), _jsxs("div", { children: [_jsx("label", { children: "Observa\u00E7\u00F5es" }), _jsx("textarea", { className: "input", rows: 4, value: obs, onChange: e => setObs(e.target.value), disabled: !canEdit })] }), canEdit && _jsxs("div", { style: { display: "flex", gap: 8, justifyContent: "end" }, children: [_jsx("button", { className: "btn destructive", onClick: () => send("reprovar"), children: "Reprovar" }), _jsx("button", { className: "btn accent", onClick: () => send("aprovar"), children: "Aprovar" })] })] });
}
function Status4({ solicitacaoId, canEdit, onSaved }) {
    const [tempo, setTempo] = useState("");
    const [data, setData] = useState("");
    const [file, setFile] = useState(null);
    const [users, setUsers] = useState([]);
    const [selUsers, setSelUsers] = useState([]);
    const [err, setErr] = useState(null);
    useEffect(() => {
        get(`/api/solicitacoes/${solicitacaoId}/key-users`).then(setUsers).catch(() => setUsers([]));
    }, [solicitacaoId]);
    const save = async () => {
        setErr(null);
        try {
            if (file) {
                const fd = new FormData();
                fd.append("files", file);
                await fetch(`/api/solicitacoes/${solicitacaoId}/upload?ordem=4`, { method: "POST", body: fd, credentials: "include" }).then(async (r) => { if (!r.ok)
                    throw await r.json(); });
            }
            const usuariosChave = users.filter(u => selUsers.includes(u.id));
            await post(`/api/solicitacoes/${solicitacaoId}/form/4`, { tempoGastoRequisitos: tempo, dataFimRequisitos: data });
            onSaved();
        }
        catch (e) {
            setErr(e.message || "Erro");
        }
    };
    return _jsxs("div", { className: "grid", style: { gap: 12 }, children: [err && _jsx("div", { className: "alert", children: err }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { children: [_jsx("label", { children: "Tempo Gasto com Requisitos" }), _jsx("input", { className: "input", type: "time", value: tempo, onChange: e => setTempo(e.target.value), disabled: !canEdit })] }), _jsxs("div", { children: [_jsx("label", { children: "Data Fim Requisitos" }), _jsx("input", { className: "input", type: "date", value: data, onChange: e => setData(e.target.value), disabled: !canEdit })] }), _jsx("div", {})] }), _jsxs("div", { children: [_jsx("label", { children: "Anexo de Requisitos" }), _jsx("input", { className: "input", type: "file", onChange: e => setFile(e.target.files?.[0] || null), disabled: !canEdit })] }), canEdit && _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: save, children: "Salvar" }) })] });
}
function Status5({ solicitacaoId, canEdit, onSaved }) {
    const [err, setErr] = useState(null);
    const [files, setFiles] = useState([]);
    useEffect(() => {
        get(`/api/solicitacoes/${solicitacaoId}`).then(r => {
            const all = r.arquivos || [];
            setFiles(all.filter((a) => a.statusOrdem === 4));
        });
    }, [solicitacaoId]);
    const send = async (decisao) => {
        setErr(null);
        try {
            await post(`/api/solicitacoes/${solicitacaoId}/form/5`, { decisao });
            onSaved();
            toast(decisao === "aprovar" ? "Aprovado" : "Reprovado");
        }
        catch (e) {
            setErr(e.message || "Erro");
        }
    };
    return _jsxs("div", { className: "grid", style: { gap: 12 }, children: [err && _jsx("div", { className: "alert", children: err }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsx("strong", { children: "Documento de Requisitos" }) }), _jsx("div", { className: "card-b", children: files.length ? files.map(f => (_jsx("div", { style: { marginBottom: 8 }, children: _jsx("a", { href: `/uploads/solicitacoes/${solicitacaoId}/4/${f.path.split("/").pop()}`, target: "_blank", rel: "noreferrer", children: f.filename }) }, f.id))) : _jsx("div", { className: "help", children: "Nenhum anexo dispon\u00EDvel." }) })] }), canEdit && _jsxs("div", { style: { display: "flex", gap: 8, justifyContent: "end" }, children: [_jsx("button", { className: "btn destructive", onClick: () => send("reprovar"), children: "Reprovar" }), _jsx("button", { className: "btn accent", onClick: () => send("aprovar"), children: "Aprovar" })] })] });
}
function Observacao({ solicitacaoId, onSaved }) {
    const [txt, setTxt] = useState("");
    return (_jsxs("div", { className: "grid", style: { gap: 8 }, children: [_jsxs("div", { children: [_jsx("label", { children: "Observa\u00E7\u00F5es" }), _jsx("textarea", { className: "input", rows: 3, value: txt, onChange: e => setTxt(e.target.value) })] }), _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn", onClick: async () => { if (!txt.trim())
                        return; await post(`/api/solicitacoes/${solicitacaoId}/notes`, { texto: txt }); setTxt(""); onSaved(); }, children: "Salvar" }) })] }));
}
