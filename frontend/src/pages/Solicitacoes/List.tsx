import React, { useEffect, useMemo, useState } from "react";
import { ApiError, get } from "../../lib/api";
import { Link, useNavigate } from "react-router-dom";

type Row = {
  id:number; titulo:string; area:string; status:number;
  solicitante:{ name:string }; analistaRequisitos?:{ name:string } | null;
};

const statusTitle = (i:number)=> {
  const map: Record<number,string> = { 1:"Análise de prioridade", 2:"Agendamento de entrevistas", 3:"Aprovação de processos", 4:"Formalização de requisitos", 5:"Aprovação de requisitos" };
  return map[i] || `Status ${i}`;
};

export default function ListSolicitacoes(){
  const [rows,setRows] = useState<Row[]>([]);
  const [err,setErr] = useState<string|null>(null);
  const [groupByAnalista, setGroup] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    get<Row[]>("/api/solicitacoes")
      .then(setRows)
      .catch((e: ApiError) => setErr(e.message || e.error));
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(()=>{
    if(!groupByAnalista) return null;
    const idx: Record<string, Row[]> = {};
    for(const s of rows){
      const key = s.analistaRequisitos?.name || "Sem analista";
      (idx[key] ||= []).push(s);
    }
    return idx;
  },[groupByAnalista, rows]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="topbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="Buscar por título ou área" />
        <div style={{ marginLeft: "auto" }} />
        <button className="btn primary" onClick={()=>navigate("/solicitacoes/nova")}>Nova</button>
      </div>
      <div className="card">
        <div className="card-h" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>Solicitações</strong>
          <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={groupByAnalista} onChange={e=>setGroup(e.target.checked)} />
            Agrupar por Analista de Requisitos
          </label>
        </div>
        <div className="card-b">
          {err && <div className="alert" style={{ marginBottom: 8 }}>{err}</div>}
          {!groupByAnalista ? (
            <table className="table">
              <thead><tr><th>Título</th><th>Área</th><th>Solicitante</th><th>Analista</th><th>Status</th><th style={{ width: 90 }}>Ações</th></tr></thead>
              <tbody>
                {rows.map(s=>(
                  <tr key={s.id}>
                    <td>{s.titulo}</td><td>{s.area}</td>
                    <td>{s.solicitante.name}</td>
                    <td>{s.analistaRequisitos?.name || "—"}</td>
                    <td><span className="badge">{statusTitle(s.status)}</span></td>
                    <td><Link to={`/solicitacoes/${s.id}`} className="btn">Abrir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid" style={{ gap: 10 }}>
              {Object.entries(grouped || {}).map(([analista, list]) => (
                <div key={analista} className="card">
                  <div className="card-h"><strong>{analista}</strong><span className="badge">{list.length}</span></div>
                  <div className="card-b" style={{ paddingTop: 0 }}>
                    <table className="table">
                      <thead><tr><th>Título</th><th>Área</th><th>Solicitante</th><th>Status</th><th style={{ width: 90 }}>Ações</th></tr></thead>
                      <tbody>
                        {list.map(s=>(
                          <tr key={s.id}>
                            <td>{s.titulo}</td><td>{s.area}</td>
                            <td>{s.solicitante.name}</td>
                            <td><span className="badge">{statusTitle(s.status)}</span></td>
                            <td><Link to={`/solicitacoes/${s.id}`} className="btn">Abrir</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
