import React, { useEffect, useState } from "react";
import { ApiError, del, get, post } from "../lib/api";

type StatusItem = {
  id: number;
  nome: string;
  ordem: number;
  tipo: string;
};

export default function Status() {
  const [rows, setRows] = useState<StatusItem[]>([]);
  const [nome, setNome] = useState("");
  const [ordem, setOrdem] = useState<number | string>("");
  const [tipo, setTipo] = useState("SOLICITAÇÃO");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await get<StatusItem[]>("/api/status");
      data.sort((a, b) => {
        if (a.tipo === b.tipo) return a.ordem - b.ordem;
        return a.tipo.localeCompare(b.tipo, "pt-BR");
      });
      setRows(data);
    } catch (e: any) {
      const ae = e as ApiError;
      setErr(ae.message || ae.error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    setErr(null);
    if (!nome.trim()) return setErr("Informe o nome do status.");
    if (!ordem) return setErr("Informe a ordem.");
    if (!tipo) return setErr("Selecione o tipo.");

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
    } catch (e: any) {
      const ae = e as ApiError;
      setErr(ae.message || ae.error || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Excluir este status?")) return;
    try {
      await del(`/api/status/${id}`);
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
          <strong>Status</strong>
          <div className="help">Cadastro</div>
        </div>

        <div className="card-b grid" style={{ gap: 12 }}>
          {err && <div className="alert">{err}</div>}

          <div className="grid grid-3">
            <div>
              <label>Nome</label>
              <input
                className="input"
                placeholder="Nome do status"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div>
              <label>Ordem</label>
              <input
                className="input"
                type="number"
                placeholder="Ordem"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
              />
            </div>

            <div>
              <label>Tipo</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="SOLICITAÇÃO">SOLICITAÇÃO</option>
                <option value="GMUD">GMUD</option>
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
          <strong>Lista de Status</strong>
        </div>
        <div className="card-b">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Ordem</th>
                <th>Tipo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.nome}</td>
                  <td>{r.ordem}</td>
                  <td>{r.tipo}</td>
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
                    Nenhum status cadastrado
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
