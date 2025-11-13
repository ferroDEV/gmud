import React, { useEffect, useMemo, useState } from "react";
import { ApiError, post } from "../../lib/api";
import { useNavigate } from "react-router-dom";

type UserOpt = { id: number; name: string; area: string };

export default function NovaSolicitacao() {
  const nav = useNavigate();
  const hoje = useMemo(() => new Date().toLocaleDateString(), []);

  // Solicitante (select-search)
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<UserOpt[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<UserOpt | null>(null);

  // Campos principais
  const [area, setArea] = useState("");

  // ÁREAS ENVOLVIDAS — multi select-search
  const [areasCat, setAreasCat] = useState<string[]>([]);
  const [qArea, setQArea] = useState("");
  const [optsAreas, setOptsAreas] = useState<string[]>([]);
  const [openArea, setOpenArea] = useState(false);
  const [selAreas, setSelAreas] = useState<string[]>([]);
  const addArea = (a: string) => {
    if (!selAreas.includes(a)) setSelAreas((prev) => [...prev, a]);
    setOpenArea(false);
    setQArea("");
  };
  const removeArea = (a: string) => setSelAreas((prev) => prev.filter((x) => x !== a));

  // RESPONSÁVEIS/HOMOLOGADORES — multi select-search por usuário
  const [qResp, setQResp] = useState("");
  const [optsResp, setOptsResp] = useState<UserOpt[]>([]);
  const [openResp, setOpenResp] = useState(false);
  const [selResp, setSelResp] = useState<UserOpt[]>([]);
  const addResp = (u: UserOpt) => {
    if (!selResp.some((x) => x.id === u.id)) setSelResp((prev) => [...prev, u]);
    setOpenResp(false);
    setQResp("");
    setOptsResp([]);
  };
  const removeResp = (id: number) => setSelResp((prev) => prev.filter((u) => u.id !== id));

  // Campos textuais
  const [onde, setOnde] = useState("");
  const [porque, setPorque] = useState("");
  const [processosAfetados, setProcessosAfetados] = useState("");
  const [processoAtual, setProcessoAtual] = useState("");
  const [impacto, setImpacto] = useState<"Alto" | "Médio" | "Baixo">("Baixo");
  const [urgencia, setUrgencia] = useState<"Alta" | "Média" | "Baixa">("Baixa");
  const [justificativa, setJustificativa] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const needJust = impacto === "Alto" || urgencia === "Alta";

  // Carrega catálogo de áreas 1x e filtra pelo termo
  useEffect(() => {
    fetch("/api/areas", { credentials: "include" })
      .then((r) => r.json())
      .then((arr: string[]) => {
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
        const data: UserOpt[] = await res.json();
        setOptsResp(data || []);
        setOpenResp(true);
      } catch {
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
        const data: UserOpt[] = await res.json();
        setOpts(data);
        setOpen(true);
      } catch {
        setOpts([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Atualiza área conforme o usuário selecionado
  useEffect(() => {
    if (sel) setArea(sel.area || "");
  }, [sel]);

  const save = async () => {
    setErr(null);
    if (!sel) return setErr("Selecione o solicitante.");
    if (!selAreas.length) return setErr("Selecione ao menos uma área envolvida.");
    if (!selResp.length) return setErr("Selecione ao menos um responsável/homologador.");
    if (needJust && !justificativa.trim()) return setErr("Informe a justificativa para impacto/urgência altos.");

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
      const res: any = await post("/api/solicitacoes", {
        titulo,
        area: areaPrincipal,
        solicitanteId: sel.id, // solicitante correto
        form,
      });
      nav(`/solicitacoes/${res.id}`);
    } catch (e: any) {
      const ae = e as ApiError;
      setErr(ae.message || ae.error || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-h">
          <strong>Solicitação de GMUD</strong>
          <div className="help">Cadastro</div>
        </div>
        <div className="card-b grid" style={{ gap: 12 }}>
          {err && <div className="alert">{err}</div>}

          {/* Data, Solicitante, Área */}
          <div className="grid grid-3">
            <div>
              <label>Data</label>
              <input className="input" value={hoje} readOnly />
            </div>

            <div style={{ position: "relative" }}>
              <label>Solicitante</label>
              <input
                className="input"
                placeholder="Pesquisar usuário"
                value={sel ? sel.name : q}
                onChange={(e) => {
                  setSel(null);
                  setQ(e.target.value);
                }}
                onFocus={() => q && setOpen(true)}
              />
              {open && opts.length > 0 && !sel && (
                <div
                  style={{
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
                  }}
                >
                  {opts.map((u) => (
                    <div
                      key={`${u.id || u.name}-${u.area}`}
                      onClick={() => {
                        setSel(u);
                        setOpen(false);
                      }}
                      style={{ padding: "8px 10px", cursor: "pointer" }}
                    >
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div className="help">{u.area || "Sem área"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label>Área</label>
              <input className="input" value={area} readOnly />
            </div>
          </div>

          {/* Descrições e Áreas envolvidas */}
          <div className="grid grid-3">
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Onde será feito?</label>
              <textarea className="input" rows={3} value={onde} onChange={(e) => setOnde(e.target.value)} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Por que será feito?</label>
              <textarea className="input" rows={3} value={porque} onChange={(e) => setPorque(e.target.value)} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Quais as áreas envolvidas nessa solicitação?</label>
              <div className="grid" style={{ gap: 8 }}>
                <input
                  className="input"
                  placeholder="Buscar área"
                  value={qArea}
                  onChange={(e) => setQArea(e.target.value)}
                  onFocus={() => setOpenArea(true)}
                />

                {openArea && optsAreas.length > 0 && (
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--bg-2)",
                      borderRadius: 10,
                      maxHeight: 260,
                      overflowY: "auto",
                    }}
                  >
                    {optsAreas.map((a) => (
                      <div key={a} style={{ padding: "8px 10px", cursor: "pointer" }} onClick={() => addArea(a)}>
                        {a}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selAreas.map((a) => (
                    <span key={a} className="badge" style={{ display: "inline-flex", gap: 6 }}>
                      {a}
                      <button className="btn icon" onClick={() => removeArea(a)} aria-label="remover">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Quais processos serão afetados?</label>
              <textarea
                className="input"
                rows={3}
                value={processosAfetados}
                onChange={(e) => setProcessosAfetados(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>O processo é feito atualmente de que forma?</label>
              <textarea className="input" rows={3} value={processoAtual} onChange={(e) => setProcessoAtual(e.target.value)} />
            </div>

            {/* Responsáveis/Homologadores */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Quem serão os responsáveis pelas regras e pela homologação?</label>
              <div className="grid" style={{ gap: 8 }}>
                <input
                  className="input"
                  placeholder="Buscar usuário por nome"
                  value={qResp}
                  onChange={(e) => setQResp(e.target.value)}
                  onFocus={() => qResp && setOpenResp(true)}
                />

                {openResp && optsResp.length > 0 && (
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--bg-2)",
                      borderRadius: 10,
                      maxHeight: 260,
                      overflowY: "auto",
                    }}
                  >
                    {optsResp.map((u) => (
                      <div
                        key={`${u.id || u.name}-${u.area}`}
                        style={{ padding: "8px 10px", cursor: "pointer" }}
                        onClick={() => addResp(u)}
                      >
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div className="help">{u.area || "Sem área"}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selResp.map((u) => (
                    <span key={`${u.id || u.name}-${u.area}`} className="badge" style={{ display: "inline-flex", gap: 6 }}>
                      {u.name} · {u.area}
                      <button className="btn icon" onClick={() => removeResp(u.id)} aria-label="remover">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Impacto/Urgência */}
          <div className="grid grid-3">
            <div>
              <label>Impacto</label>
              <select className="input" value={impacto} onChange={(e) => setImpacto(e.target.value as any)}>
                <option value="Alto">Alto</option>
                <option value="Médio">Médio</option>
                <option value="Baixo">Baixo</option>
              </select>
            </div>
            <div>
              <label>Urgência</label>
              <select className="input" value={urgencia} onChange={(e) => setUrgencia(e.target.value as any)}>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div />
          </div>

          {needJust && (
            <div>
              <label>Justificativa</label>
              <textarea className="input" rows={3} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
            </div>
          )}

          {/* Ações */}
          <div style={{ display: "flex", gap: 8, justifyContent: "end" }}>
            <button className="btn" type="button" onClick={() => nav("/solicitacoes")}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn accent"
              onClick={(e) => {
                e.preventDefault();
                save();
              }}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
