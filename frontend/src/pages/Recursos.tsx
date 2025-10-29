import React, { useEffect, useState } from "react";
import { del, get, post } from "../lib/api";

type Recurso = { id:number; nome:string; tipo:string };

export default function Recursos(){
  const [rows, setRows] = useState<Recurso[]>([]);
  const [nome,setNome] = useState(""); const [tipo,setTipo] = useState("DEV");

  const load = ()=> get<Recurso[]>("/api/recursos").then(setRows);
  useEffect(load,[]);

  const add = async ()=>{ if(!nome.trim()) return; await post("/api/recursos",{ nome, tipo }); setNome(""); load(); };
  const remove = async (id:number)=>{ await del(`/api/recursos/${id}`); load(); };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-h"><strong>Cadastrar Recurso</strong></div>
        <div className="card-b grid grid-3">
          <div><label>Nome</label><input className="input" value={nome} onChange={e=>setNome(e.target.value)} /></div>
          <div><label>Tipo</label>
            <select className="input" value={tipo} onChange={e=>setTipo(e.target.value)}>
              <option>DEV</option><option>REQUISITOS</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "end" }}><button className="btn primary" onClick={add}>Salvar</button></div>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><strong>Recursos</strong></div>
        <div className="card-b">
          <table className="table">
            <thead><tr><th>Nome</th><th>Tipo</th><th style={{ width: 120 }}>Ações</th></tr></thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}>
                  <td>{r.nome}</td><td><span className="badge">{r.tipo}</span></td>
                  <td><div style={{ display: "flex", gap: 8 }}>
                    <button className="btn">Editar</button>
                    <button className="btn destructive" onClick={()=>remove(r.id)}>Excluir</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
