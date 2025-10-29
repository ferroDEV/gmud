import React, { useState } from "react";
import { post } from "../../lib/api";
import { useNavigate } from "react-router-dom";

export default function SolicitacaoAvulsa(){
  const [f, setF] = useState({ titulo:"", area:"", solicitanteId: 1, analistaRequisitosId: undefined as number|undefined });
  const nav = useNavigate();
  const save = async ()=>{
    await post("/api/solicitacoes", f);
    alert("Solicitação cadastrada. Entre no sistema para acompanhar.");
    nav("/login");
  };
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ width: 640, maxWidth: "94vw" }}>
        <div className="card-h"><strong>Solicitação de GMUD</strong><div className="help">Tela pública avulsa</div></div>
        <div className="card-b grid grid-2">
          <div><label>Título</label><input className="input" value={f.titulo} onChange={e=>setF({ ...f, titulo: e.target.value })} /></div>
          <div><label>Área</label><input className="input" value={f.area} onChange={e=>setF({ ...f, area: e.target.value })} /></div>
          <div><label>ID do Solicitante</label><input className="input" type="number" value={f.solicitanteId} onChange={e=>setF({ ...f, solicitanteId: parseInt(e.target.value||'1',10) })} /></div>
          <div><label>ID Analista Requisitos (opcional)</label><input className="input" type="number" value={f.analistaRequisitosId||''} onChange={e=>setF({ ...f, analistaRequisitosId: e.target.value?parseInt(e.target.value,10):undefined })} /></div>
          <div style={{ gridColumn:"1 / -1", display: "flex", justifyContent:"end", gap: 8 }}>
            <button className="btn" onClick={()=>nav("/login")}>Voltar</button>
            <button className="btn accent" onClick={save}>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
