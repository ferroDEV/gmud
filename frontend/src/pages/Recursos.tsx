import React, { useEffect, useRef, useState } from "react";
import { ApiError, del, get, post } from "../lib/api";

type Recurso = {
  id: number;
  nome: string;
  tipo: string;
  areaNegocio: string;
};

type UserOpt = { id: number; name: string; area: string };

export default function Recursos() {
  const [rows, setRows] = useState<Recurso[]>([]);
  const [nomeSel, setNomeSel] = useState<UserOpt | null>(null);
  const [qNome, setQNome] = useState("");
  const [optsNome, setOptsNome] = useState<UserOpt[]>([]);
  const [openNome, setOpenNome] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tipo, setTipo] = useState("DESENVOLVEDOR");
  const [areaNegocio, setAreaNegocio] = useState("BI");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Áreas de negócio fixas
  const areasNegocioCat = ["BI", "PROTHEUS", "REQUISITOS", "WEB"].sort();

  const load = async () => {
    try {
      const data = await get<Recurso[]>("/api/recursos");
      // ordena por nome antes de exibir
      data.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      setRows(data);
    } catch (e: any) {
      const ae = e as ApiError;
      setErr(ae.message || ae.error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Busca de usuários para o campo Nome
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!qNome) {
      setOptsNome([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(qNome)}`, { credentials: "include" });
        const data: UserOpt[] = await res.json();
        setOptsNome(data);
        setOpenNome(true);
      } catch {
        setOptsNome([]);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [qNome]);

  const add = async () => {
    setErr(null);
    if (!nomeSel) return setErr("Selecione o usuário para o campo Nome.");
    if (!tipo) return setErr("Selecione o tipo.");
    if (!areaNegocio) return setErr("Selecione a área de negócio.");

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
    } catch (e: any) {
      const ae = e as ApiError;
      setErr(ae.message || ae.error || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Excluir recurso?")) return;
    try {
      await del(`/api/recursos/${id}`);
      setRows(rows.filter((r) => r.id !== id));
    } catch (e: any) {
      const ae = e as ApiError;
      setErr(ae.message || ae.error);
    }
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-h">
          <strong>Recursos</strong>
          <div className="help">Cadastro</div>
        </div>

        <div className="card-b grid" style={{ gap: 12 }}>
          {err && <div className="alert">{err}</div>}

          <div className="grid grid-3">
            <div style={{ position: "relative" }}>
              <label>Nome</label>
              <input
                className="input"
                placeholder="Pesquisar usuário"
                value={nomeSel ? nomeSel.name : qNome}
                onChange={(e) => {
                  setNomeSel(null);
                  setQNome(e.target.value);
                }}
                onFocus={() => qNome && setOpenNome(true)}
              />
              {openNome && optsNome.length > 0 && !nomeSel && (
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
                  {optsNome.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setNomeSel(u);
                        setOpenNome(false);
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
              <label>Tipo</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="DESENVOLVEDOR">DESENVOLVEDOR</option>
                <option value="NEGÓCIOS">NEGÓCIOS</option>
              </select>
            </div>

            <div>
              <label>Área de negócio</label>
              <select className="input" value={areaNegocio} onChange={(e) => setAreaNegocio(e.target.value)}>
                {areasNegocioCat.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "end" }}>
            <button className="btn accent" onClick={add} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <strong>Lista de Recursos</strong>
        </div>
        <div className="card-b">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Área de negócio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.nome}</td>
                  <td>{r.tipo}</td>
                  <td>{r.areaNegocio}</td>
                  <td>
                    <button className="btn" onClick={() => remove(r.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="help" style={{ textAlign: "center" }}>
                    Nenhum recurso cadastrado
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
