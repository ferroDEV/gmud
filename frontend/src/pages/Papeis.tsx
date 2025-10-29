import React, { useEffect, useState } from "react";
import { del, get, post } from "../lib/api";
type Papel = { id:number; nome:string };
export default function Papeis(){
  const [rows,setRows] = useState<Papel[]>([]);
  const [nome,setNome] = useState("");
  const load = ()=> get<Papel[]>("/api/papeis").then(setRows);
  useEffect(load,[]);
  const add = async ()=>{ if(!nome.trim()) return; await post("/api/papeis",{ nome }); setNome(""); load(); };
  const remove = async (id:number)=>{ await del(`/api/papeis/${id}`); load(); };
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-h"><strong>Cadastrar Papel</strong></div>
        <div className="card-b grid grid-3">
          <div><label>Nome</label><input className="input" value={nome} onChange={e=>setNome(e.target.value)} /></div>
          <div style={{ display: "flex", alignItems: "end" }}><button className="btn primary" onClick={add}>Salvar</button></div>
        </div>
      </div>
      <div className="card">
        <div className="card-h"><strong>Papéis</strong></div>
        <div className="card-b">
          <table className="table"><thead><tr><th>Nome</th><th style={{ width:120 }}>Ações</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}><td>{r.nome}</td><td><div style={{ display:"flex", gap:8 }}>
                <button className="btn">Editar</button>
                <button className="btn destructive" onClick={()=>remove(r.id)}>Excluir</button>
              </div></td></tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
