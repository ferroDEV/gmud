import React, { useEffect, useState } from "react";
import { get, post } from "../../lib/api";
import { useParams } from "react-router-dom";

type Row = any;
const statusTitle = (i:number)=> {
  const map: Record<number,string> = { 1:"Análise de prioridade", 2:"Agendamento de entrevistas", 3:"Aprovação de processos", 4:"Formalização de requisitos", 5:"Aprovação de requisitos" };
  return map[i] || `Status ${i}`;
};

export default function DetalheSolicitacao(){
  const { id } = useParams();
  const [row, setRow] = useState<Row | null>(null);

  const load = ()=> get<Row>(`/api/solicitacoes/${id}`).then(setRow);
  useEffect(load,[id]);

  if(!row) return <div className="help">Carregando...</div>;

  const avancar = async (to:number)=>{
    await post(`/api/solicitacoes/${row.id}/transition`, { to });
    load();
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-h"><strong>{row.titulo}</strong><div className="help">Criada em {new Date(row.createdAt).toLocaleString()}</div></div>
        <div className="card-b grid grid-3">
          <Info label="Área" value={row.area} />
          <Info label="Solicitante" value={row.solicitante?.name} />
          <Info label="Analista Requisitos" value={row.analistaRequisitos?.name || "—"} />
          <Info label="Status" value={statusTitle(row.status)} />
        </div>
      </div>

      <div className="card">
        <div className="card-h"><strong>Fluxo</strong></div>
        <div className="card-b">
          <div className="grid" style={{ gap: 8 }}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 8 }}>
              {[1,2,3,4,5].map(i=>(<div key={i} className="badge" style={{ opacity: row.status===i?1:.65 }}>{i}. {statusTitle(i)}</div>))}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"end" }}>
              {row.status>1 && <button className="btn" onClick={()=>avancar(row.status-1)}>Voltar</button>}
              {row.status===5 ? (
                <>
                  <button className="btn destructive" onClick={()=>avancar(4)}>Reprovar</button>
                  <button className="btn accent" onClick={()=>avancar(999)}>Aprovar e criar GMUD</button>
                </>
              ) : (
                <button className="btn primary" onClick={()=>avancar(row.status+1)}>Salvar e avançar</button>
              )}
            </div>
            <div>
              <strong>Acompanhamento</strong>
              <div className="grid" style={{ marginTop: 8 }}>
                {row.logs.map((l:any)=>(
                  <div key={l.id} className="grid" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center", gap: 8 }}>
                    <span className="badge">{new Date(l.ts).toLocaleDateString()}</span>
                    <div className="help"><b>{l.user}</b> — {l.acao}</div>
                  </div>
                ))}
                {!row.logs.length && <div className="help">Sem registros</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }:{ label:string; value?:React.ReactNode }){
  return <div className="card"><div className="card-b"><div className="help">{label}</div><div style={{ fontWeight: 600 }}>{value}</div></div></div>;
}
