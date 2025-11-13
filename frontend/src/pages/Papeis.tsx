import React, { useEffect, useRef, useState } from "react";
import { ApiError, del, get, post } from "../lib/api";

type Papel = {
  id: number;
  nome: string;
  cargos: { cargoId: string; cargoNome: string }[];
};

type CargoOpt = {
  [x: string]: string; id: string; nome: string
};

export default function Papeis() {
  const [rows, setRows] = useState<Papel[]>([]);
  const [nome, setNome] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);

  // select-search cargos
  const [qCargo, setQCargo] = useState("");
  const [optsCargo, setOptsCargo] = useState<CargoOpt[]>([]);
  const [openCargo, setOpenCargo] = useState(false);
  const [selCargos, setSelCargos] = useState<CargoOpt[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => {
    try {
      const data = await get<Papel[]>("/api/papeis");
      // ordena por nome
      data.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      setRows(data);
    } catch (e: any) {
      const ae = e as ApiError;
      setErr(ae.message || ae.error);
    }
  };

  useEffect(() => { load(); }, []);

  // busca cargos no servidor (SQL Server)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!qCargo) {
      setOptsCargo([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/cargos?q=${encodeURIComponent(qCargo)}`, { credentials: "include" });
        const data: CargoOpt[] = await r.json();
        setOptsCargo(data);
        setOpenCargo(true);
      } catch {
        setOptsCargo([]);
      }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [qCargo]);

  const addCargo = (c: CargoOpt) => {
    if (!selCargos.some(s => s.id === c.id)) setSelCargos(prev => [...prev, c]);
    setOpenCargo(false);
    setQCargo("");
    setOptsCargo([]);
  };
  const removeCargo = (id: string) => setSelCargos(prev => prev.filter(c => c.id !== id));

  const add = async () => {
    setErr(null);
    if (!nome.trim()) return setErr("Informe o nome do papel.");
    setSaving(true);
    try {
      if (editId === null) {
        // criar
        await post("/api/papeis", {
          nome,
          cargos: selCargos, // [{id,nome}]
        });
      } else {
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
          if (!r.ok) throw await r.json();
        });
      }

      setNome("");
      setSelCargos([]);
      setEditId(null);
      await load();
    } catch (e: any) {
      const ae = e as ApiError;
      setErr(ae.message || ae.error || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };


  const remove = async (id: number) => {
    if (!confirm("Excluir este papel? Os vínculos de cargos serão removidos.")) return;
    try {
      await del(`/api/papeis/${id}`);
      setRows(rows.filter(r => r.id !== id));
    } catch (e: any) {
      const ae = e as ApiError;
      setErr(ae.message || ae.error);
    }
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-h">
          <strong>Papéis</strong>
          <div className="help">Cadastro</div>
        </div>

        <div className="card-b grid" style={{ gap: 12 }}>
          {err && <div className="alert">{err}</div>}

          <div className="grid grid-3">
            <div>
              <label>Nome do papel</label>
              <input className="input" value={nome} onChange={(e)=>setNome(e.target.value)} placeholder="Ex.: REQUISITOS, ANALISTA, ADMIN..." />
            </div>

            <div className="col-span-2" style={{ position: "relative" }}>
              <label>Cargo(s)</label>
              <input
                className="input"
                placeholder="Buscar cargo"
                value={qCargo}
                onChange={(e) => setQCargo(e.target.value)}
                onFocus={() => qCargo && setOpenCargo(true)}
              />
              {openCargo && optsCargo.length > 0 && (
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
                    maxHeight: 260,
                    overflowY: "auto",
                  }}
                >
                  {optsCargo.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => addCargo(c)}
                      style={{ padding: "8px 10px", cursor: "pointer" }}
                    >
                      {c.nome}
                      <div className="help">{c.area || "Sem área"}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* chips selecionados */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {selCargos.map((c) => (
                  <span key={c.id} className="badge" style={{ display: "inline-flex", gap: 6 }}>
                    {c.nome}
                    <button className="btn icon" onClick={() => removeCargo(c.id)} aria-label="remover">✕</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "end" }}>
            {editId !== null && (
              <button
                className="btn"
                onClick={() => {
                  setEditId(null);
                  setNome("");
                  setSelCargos([]);
                }}
                disabled={saving}
              >
                Cancelar
              </button>
            )}
            <button className="btn accent" onClick={add} disabled={saving}>
              {saving ? "Salvando..." : editId === null ? "Salvar" : "Atualizar"}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <strong>Lista de Papéis</strong>
        </div>
        <div className="card-b">
          <table className="table">
            <thead>
              <tr>
                <th>Papel</th>
                <th>Cargo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.nome}</td>
                  <td>{r.cargos?.map(c => c.cargoNome).sort((a,b)=>a.localeCompare(b,"pt-BR")).join(", ") || "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn" onClick={() => {
                        // habilita modo edição carregando o formulário com os dados da linha
                        setEditId(r.id);
                        setNome(r.nome);
                        setSelCargos((r.cargos || []).map(c => ({ id: c.cargoId, nome: c.cargoNome })));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}>
                        Editar
                      </button>
                      <button className="btn" onClick={() => remove(r.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="help" style={{ textAlign: "center" }}>
                    Nenhum papel cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
