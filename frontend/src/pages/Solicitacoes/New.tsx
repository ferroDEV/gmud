import React, { useEffect, useState } from "react";
import { get, post } from "../../lib/api";
import { useNavigate } from "react-router-dom";

type User = { id:number; name:string };
export default function NovaSolicitacao(){
  const [users,setUsers] = useState<User[]>([]); // placeholder: usa admin + AD criados no uso real
  const [solicitanteId, setSolicitante] = useState(1);
  const [analistaId, setAnalista] = useState<number|undefined>(undefined);
  const [titulo, setTitulo] = useState(""); const [area, setArea] = useState("");
  const nav = useNavigate();

  useEffect(()=>{
    // usa os usuários existentes (admin + os criados via AD ao longo do tempo)
    get<any>("/api/auth/me").then(()=>{}).catch(()=>{});
    // simplificação: não expomos listagem de usuários; use IDs já existentes
    // para demonstração, setamos solicitanteId=1 (admin) se existir
  },[]);

  const save = async ()=>{
    const row = await post("/api/solicitacoes", { titulo, area, solicitanteId, analistaRequisitosId: analistaId });
    nav(`/solicitacoes/${row.id}`);
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-h"><strong>Solicitação de GMUD</strong><div className="help">Cadastro</div></div>
        <div className="card-b grid grid-2">
          <div><label>Título</label><input className="input" value={titulo} onChange={e=>setTitulo(e.target.value)} /></div>
          <div><label>Área</label><input className="input" value={area} onChange={e=>setArea(e.target.value)} /></div>
          <div><label>ID do Solicitante</label><input className="input" type="number" value={solicitanteId} onChange={e=>setSolicitante(parseInt(e.target.value||'1',10))} /></div>
          <div><label>ID Analista de Requisitos (opcional)</label><input className="input" type="number" value={analistaId||''} onChange={e=>setAnalista(e.target.value?parseInt(e.target.value,10):undefined)} /></div>
          <div style={{ gridColumn:"1 / -1", display:"flex", gap:8, justifyContent:"end" }}>
            <button className="btn" onClick={()=>window.history.back()}>Voltar</button>
            <button className="btn accent" onClick={save}>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
