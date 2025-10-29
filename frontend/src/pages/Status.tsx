import React, { useEffect, useMemo, useState } from "react";
import { del, get, patch, post } from "../lib/api";

type Row = { id:number; nome:string; ordem:number };

export default function StatusPage(){
  const [rows, setRows] = useState<Row[]>([]);
  const [nome, setNome] = useState(""); const [ordem,setOrdem] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ nome:string; ordem:number }>({ nome:"", ordem:1 });

  const load = ()=> get<Row[]>("/api/status").then(setRows);
  useEffect(load,[]);

  const add = async ()=>{ if(!nome.trim()) return; await post("/api/status", { nome, ordem }); setNome(""); setOrdem((o)=>o+1); load(); };
  const startEdit = (r:Row)=>{ setEditId(r.id); setDraft({ nome:r.nome, ordem:r.ordem }); };
  const save = async ()=>{ if(editId==null) return; await patch(`/api/status/${editId}`, draft); setEditId(null); load(); };
  const remove = async (id:number)=>{ await del(`/api/status/${id}`); load(); };

  const sorted = useMemo(()=> [...rows].sort((a,b)=>a.ordem - b.ordem), [rows]);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-h"><strong>Cadastrar Status</strong></div>
        <div className="card-b grid grid-3">
          <div><label>Nome</label><input className="input" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex.: Fila de Desenvolvimento" /></div>
          <div><label>Ordem</label><input className="input" type="number" value={ordem} onChange={e=>setOrdem(parseInt(e.target.value || '1',10))} /></div>
          <div style={{ display: "flex", alignItems: "end" }}><button className="btn primary" onClick={add}>Salvar</button></div>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><strong>Status</strong></div>
        <div className="card-b grid" style={{ gap: 8 }}>
          {sorted.map(s=>(
            <div key={s.id} className="grid" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
              {editId===s.id ? (
                <div className="grid grid-3">
                  <div><label>Nome</label><input className="input" value={draft.nome} onChange={e=>setDraft({ ...draft, nome:e.target.value })} /></div>
                  <div><label>Ordem</label><input className="input" type="number" value={draft.ordem} onChange={e=>setDraft({ ...draft, ordem: parseInt(e.target.value || '1',10) })} /></div>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span className="badge">#{s.ordem}</span>
                  <strong>{s.nome}</strong>
                </div>
              )}
              <div style={{ justifySelf: "end", display:"flex", gap:8 }}>
                {editId===s.id ? (
                  <>
                    <button className="btn" onClick={save}>Salvar</button>
                    <button className="btn" onClick={()=>setEditId(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button className="btn" onClick={()=>startEdit(s)}>Editar</button>
                    <button className="btn destructive" onClick={()=>remove(s.id)}>Excluir</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
