import React, { useEffect, useMemo, useState } from "react";
import { get } from "../../lib/api";
import { Link } from "react-router-dom";

type Row = {
  id:number; titulo:string; status:number;
  solicitante:{ name:string }; analistaRequisitos?:{ name:string } | null;
};

const statusTitle = (i:number)=> {
  const map: Record<number,string> = { 1:"Análise de investimentos", 2:"Fila de Desenvolvimento", 3:"Desenvolvimento", 4:"Homologação Interna", 5:"Homologação Solicitante", 6:"Go Live", 7:"Finalizado" };
  return map[i] || `Status ${i}`;
};

export default function ListGmuds(){
  const [rows,setRows] = useState<Row[]>([]);
  const [groupByAnalista, setGroup] = useState(true);
  const load = ()=> get<Row[]>("/api/gmuds").then(setRows);
  useEffect(load,[]);

  const grouped = useMemo(()=>{
    if(!groupByAnalista) return null;
    const idx: Record<string, Row[]> = {};
    for(const g of rows){
      const key = g.analistaRequisitos?.name || "Sem analista";
      (idx[key] ||= []).push(g);
    }
    return idx;
  },[groupByAnalista, rows]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="topbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="Buscar por título" />
      </div>
      <div className="card">
        <div className="card-h" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>GMUDs</strong>
          <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={groupByAnalista} onChange={e=>setGroup(e.target.checked)} />
            Agrupar por Analista de Requisitos
          </label>
        </div>
        <div className="card-b">
          {!groupByAnalista ? (
            <table className="table">
              <thead><tr><th>Título</th><th>Solicitante</th><th>Analista</th><th>Status</th><th style={{ width: 90 }}>Ações</th></tr></thead>
              <tbody>
                {rows.map(g=>(
                  <tr key={g.id}>
                    <td>{g.titulo}</td>
                    <td>{g.solicitante.name}</td>
                    <td>{g.analistaRequisitos?.name || "—"}</td>
                    <td><span className="badge">{statusTitle(g.status)}</span></td>
                    <td><Link to={`/gmuds/${g.id}`} className="btn">Abrir</Link></td>
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
                      <thead><tr><th>Título</th><th>Solicitante</th><th>Status</th><th style={{ width: 90 }}>Ações</th></tr></thead>
                      <tbody>
                        {list.map(g=>(
                          <tr key={g.id}>
                            <td>{g.titulo}</td><td>{g.solicitante.name}</td>
                            <td><span className="badge">{statusTitle(g.status)}</span></td>
                            <td><Link to={`/gmuds/${g.id}`} className="btn">Abrir</Link></td>
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
