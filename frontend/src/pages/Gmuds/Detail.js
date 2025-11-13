import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { get, post } from "../../lib/api";
import { useParams } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { toast } from "../../components/Toast";
export default function GmudDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [row, setRow] = useState(null);
    const [tab, setTab] = useState(1);
    const [err, setErr] = useState(null);
    const load = () => {
        get(`/api/gmuds/${id}`).then(r => {
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
    const can = (roles) => user?.role === "ADMIN" || roles.includes(user?.role || "");
    return (_jsxs("div", { className: "grid", style: { gap: 16 }, children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsxs("strong", { children: ["GMUD #", row.id, " \u2014 ", row.titulo] }) }), _jsxs("div", { className: "card-b grid grid-3", children: [_jsx(Info, { label: "Solicitante", value: row.solicitante?.name }), _jsx(Info, { label: "Status", value: row.status }), _jsx(Info, { label: "Pausada", value: row.pausada ? "Sim" : "Não" }), _jsxs("div", { style: { gridColumn: "1/-1", display: "flex", gap: 8, flexWrap: "wrap" }, children: [_jsx("button", { className: "btn", onClick: async () => { await post(`/api/gmuds/${row.id}/pause`, {}); toast("OK"); load(); }, children: "Pausar/Retomar GMUD" }), _jsx("button", { className: "btn destructive", onClick: async () => {
                                            const m = prompt("Motivo do cancelamento:\n1) Repriorização\n2) Problemas técnicos\n3) Escopo alterado");
                                            if (!m)
                                                return;
                                            await post(`/api/gmuds/${row.id}/cancel`, { motivo: m });
                                            toast("GMUD cancelada");
                                            load();
                                        }, children: "Cancelar GMUD" })] })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsx("strong", { children: "Fluxo \u2014 Tipo GMUD" }) }), _jsxs("div", { className: "card-b", children: [_jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }, children: [(row.tracks || []).map((t) => (_jsx("button", { className: "btn", onClick: () => setTab(t.ordem), style: { fontWeight: tab === t.ordem ? 700 : 500 }, children: t.ordem }, t.id))), !row.tracks?.length && _jsxs("span", { className: "help", children: ["Status atual: ", row.status] })] }), tab === 1 && _jsx(S1, { row: row, canEdit: can(["ANALISTA"]), onSaved: () => { toast("Status 1 salvo"); load(); } }), tab === 2 && _jsx(S2, { row: row, canEdit: can(["ANALISTA"]), onSaved: () => { toast("Status 2 avançado"); load(); } }), tab === 3 && _jsx(S3, { row: row, canEdit: can(["ANALISTA"]), onSaved: () => { toast("Status 3 salvo"); load(); } }), tab === 4 && _jsx(S4, { row: row, canEdit: can(["REQUISITOS"]), onSaved: () => { load(); } }), tab === 5 && _jsx(S5, { row: row, canEditSolic: can(["SOLICITANTE"]), canReturn: can(["REQUISITOS"]), onSaved: () => { load(); } }), tab === 6 && _jsx(S6, { row: row, canEdit: can(["REQUISITOS", "ANALISTA"]), onSaved: () => { toast("Status 6 salvo"); load(); } }), tab > 6 && _jsx("div", { className: "help", children: "Finalizada (7)" })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsx("strong", { children: "Acompanhamento" }) }), _jsxs("div", { className: "card-b grid", style: { gap: 8 }, children: [_jsxs("div", { className: "grid", style: { gridTemplateColumns: "auto 1fr", gap: 8 }, children: [row.logs.map((l) => (_jsxs(React.Fragment, { children: [_jsx("span", { className: "badge", children: new Date(l.ts).toLocaleString() }), _jsxs("div", { className: "help", children: [_jsx("b", { children: l.user }), " \u2014 ", l.acao] })] }, l.id))), !row.logs.length && _jsx("div", { className: "help", children: "Sem registros" })] }), _jsx(Notes, { gmudId: row.id, onSaved: () => { toast("Observação registrada"); load(); } })] })] })] }));
}
function Info({ label, value }) {
    return _jsx("div", { className: "card", children: _jsxs("div", { className: "card-b", children: [_jsx("div", { className: "help", children: label }), _jsx("div", { style: { fontWeight: 600 }, children: value })] }) });
}
// ====== Forms ======
function S1({ row, canEdit, onSaved }) {
    // estimativa por dev
    const devs = (row.recursos || []).filter((l) => l.recurso?.tipo === "Desenvolvedor");
    const [vals, setVals] = useState({});
    const save = async () => {
        const estimativas = devs.map(d => ({ recursoId: d.recursoId, horas: vals[d.recursoId] || "" })).filter(e => e.horas);
        if (!estimativas.length)
            return;
        await post(`/api/gmuds/${row.id}/form/1`, { estimativas });
        onSaved();
    };
    return _jsxs("div", { className: "grid", style: { gap: 12 }, children: [_jsx("div", { className: "grid grid-3", children: devs.map(d => (_jsxs("div", { children: [_jsx("label", { children: d.recurso?.nome }), _jsx("input", { className: "input", type: "time", value: vals[d.recursoId] || "", onChange: e => setVals(v => ({ ...v, [d.recursoId]: e.target.value })), disabled: !canEdit })] }, d.recursoId))) }), canEdit && _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: save, children: "Salvar" }) })] });
}
function S2({ row, canEdit, onSaved }) {
    const go = async () => { await post(`/api/gmuds/${row.id}/form/2`, {}); onSaved(); };
    return _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: canEdit && _jsx("button", { className: "btn accent", onClick: go, children: "AVAN\u00C7AR" }) });
}
function S3({ row, canEdit, onSaved }) {
    const devs = (row.recursos || []).filter((l) => l.recurso?.tipo === "Desenvolvedor");
    const [vals, setVals] = useState({});
    const save = async () => {
        const gastos = devs.map(d => ({ recursoId: d.recursoId, horas: vals[d.recursoId] || "" })).filter(e => e.horas);
        if (!gastos.length)
            return;
        await post(`/api/gmuds/${row.id}/form/3`, { gastos });
        onSaved();
    };
    return _jsxs("div", { className: "grid", style: { gap: 12 }, children: [_jsx("div", { className: "grid grid-3", children: devs.map(d => (_jsxs("div", { children: [_jsx("label", { children: d.recurso?.nome }), _jsx("input", { className: "input", type: "time", value: vals[d.recursoId] || "", onChange: e => setVals(v => ({ ...v, [d.recursoId]: e.target.value })), disabled: !canEdit })] }, d.recursoId))) }), canEdit && _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: save, children: "Salvar" }) })] });
}
function S4({ row, canEdit, onSaved }) {
    const [tempo, setTempo] = useState("");
    const [file, setFile] = useState(null);
    const [decisao, setDecisao] = useState("aprovar");
    const save = async () => {
        if (file) {
            const fd = new FormData();
            fd.append("files", file);
            await fetch(`/api/gmuds/${row.id}/upload?ordem=4`, { method: "POST", body: fd, credentials: "include" }).then(async (r) => { if (!r.ok)
                throw await r.json(); });
        }
        await post(`/api/gmuds/${row.id}/form/4`, { tempoTestes: tempo, decisao });
        onSaved();
    };
    return _jsxs("div", { className: "grid", style: { gap: 12 }, children: [_jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { children: [_jsx("label", { children: "Tempo Gasto com Testes" }), _jsx("input", { className: "input", type: "time", value: tempo, onChange: e => setTempo(e.target.value), disabled: !canEdit })] }), _jsx("div", {}), _jsx("div", {})] }), _jsxs("div", { children: [_jsx("label", { children: "Documento de teste" }), _jsx("input", { className: "input", type: "file", onChange: e => setFile(e.target.files?.[0] || null), disabled: !canEdit })] }), _jsxs("div", { children: [_jsx("label", { children: "Decis\u00E3o" }), _jsxs("select", { className: "input", value: decisao, onChange: e => setDecisao(e.target.value), disabled: !canEdit, children: [_jsx("option", { value: "aprovar", children: "Aprovar" }), _jsx("option", { value: "reprovar", children: "Reprovar" })] })] }), canEdit && _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: save, children: "Salvar" }) })] });
}
function S5({ row, canEditSolic, canReturn, onSaved }) {
    const [obs, setObs] = useState("");
    const [files, setFiles] = useState([]);
    useEffect(() => {
        get(`/api/gmuds/${row.id}`).then(r => {
            setFiles((r.arquivos || []).filter((a) => a.statusOrdem === 4));
        });
    }, [row.id]);
    return _jsxs("div", { className: "grid", style: { gap: 12 }, children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-h", children: _jsx("strong", { children: "Documento de testes" }) }), _jsx("div", { className: "card-b", children: files.length ? files.map((f) => (_jsx("div", { style: { marginBottom: 8 }, children: _jsx("a", { href: `/uploads/gmuds/${row.id}/4/${f.path.split("/").pop()}`, target: "_blank", rel: "noreferrer", children: f.filename }) }, f.id))) : _jsx("div", { className: "help", children: "Nenhum anexo" }) })] }), canEditSolic && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { children: "Observa\u00E7\u00F5es" }), _jsx("textarea", { className: "input", rows: 3, value: obs, onChange: e => setObs(e.target.value) })] }), _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: async () => { await post(`/api/gmuds/${row.id}/form/5`, { observacoes: obs, decisao: "aprovar" }); onSaved(); }, children: "Aprovar" }) })] })), canReturn && (_jsx("div", { style: { display: "flex", justifyContent: "start" }, children: _jsx("button", { className: "btn", onClick: async () => { await post(`/api/gmuds/${row.id}/return-dev`, {}); onSaved(); }, children: "Retornar para desenvolvimento" }) }))] });
}
function S6({ row, canEdit, onSaved }) {
    const [dt, setDt] = useState("");
    const save = async () => { await post(`/api/gmuds/${row.id}/form/6`, { dataGoLive: dt }); onSaved(); };
    return _jsxs("div", { className: "grid", style: { gap: 12 }, children: [_jsx("div", { className: "grid grid-3", children: _jsxs("div", { children: [_jsx("label", { children: "Data Go Live" }), _jsx("input", { className: "input", type: "date", value: dt, onChange: e => setDt(e.target.value), disabled: !canEdit })] }) }), canEdit && _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn accent", onClick: save, children: "Salvar" }) })] });
}
function Notes({ gmudId, onSaved }) {
    const [txt, setTxt] = useState("");
    return (_jsxs("div", { className: "grid", style: { gap: 8 }, children: [_jsxs("div", { children: [_jsx("label", { children: "Observa\u00E7\u00F5es" }), _jsx("textarea", { className: "input", rows: 3, value: txt, onChange: e => setTxt(e.target.value) })] }), _jsx("div", { style: { display: "flex", justifyContent: "end" }, children: _jsx("button", { className: "btn", onClick: async () => { if (!txt.trim())
                        return; await post(`/api/gmuds/${gmudId}/notes`, { texto: txt }); setTxt(""); onSaved(); }, children: "Salvar" }) })] }));
}
