import React, { useEffect, useState } from "react";
import { ApiError, get, post } from "../../lib/api";
import { useParams } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { toast } from "../../components/Toast";

type Row = any;
type Link = { recursoId:number; recurso:{ id:number; nome:string; tipo:string } };
type Est = { recursoId:number; horas:string };

export default function GmudDetail(){
  const { id } = useParams();
  const { user } = useAuth();
  const [row, setRow] = useState<Row|null>(null);
  const [tab, setTab] = useState<number>(1);
  const [err, setErr] = useState<string|null>(null);

  const load = () => {
    get<Row>(`/api/gmuds/${id}`).then(r=>{
      setRow(r);
      const reached = (r?.tracks || []).map((t:any)=>t.ordem);
      setTab(reached.length ? reached[reached.length-1] : r.status || 1);
    }).catch((e:ApiError)=> setErr(e.message||e.error));
  };
  useEffect(()=>{ load(); },[id]);

  if (err) return <div className="alert">{err}</div>;
  if (!row) return <div className="help">Carregando...</div>;

  const can = (roles:string[]) => user?.role === "ADMIN" || roles.includes(user?.role || "");

  return (
    <div className="grid" style={{ gap: 16 }}>
      {/* Box topo */}
      <div className="card">
        <div className="card-h"><strong>GMUD #{row.id} — {row.titulo}</strong></div>
        <div className="card-b grid grid-3">
          <Info label="Solicitante" value={row.solicitante?.name} />
          <Info label="Status" value={row.status} />
          <Info label="Pausada" value={row.pausada ? "Sim" : "Não"} />
          <div style={{ gridColumn:"1/-1", display:"flex", gap:8, flexWrap:"wrap" }}>
            <button className="btn" onClick={async()=>{ await post(`/api/gmuds/${row.id}/pause`, {}); toast("OK"); load(); }}>Pausar/Retomar GMUD</button>
            <button className="btn destructive" onClick={async()=>{
              const m = prompt("Motivo do cancelamento:\n1) Repriorização\n2) Problemas técnicos\n3) Escopo alterado");
              if(!m) return;
              await post(`/api/gmuds/${row.id}/cancel`, { motivo: m });
              toast("GMUD cancelada"); load();
            }}>Cancelar GMUD</button>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="card">
        <div className="card-h"><strong>Fluxo — Tipo GMUD</strong></div>
        <div className="card-b">
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
            {(row.tracks || []).map((t:any)=>(
              <button key={t.id} className="btn" onClick={()=>setTab(t.ordem)} style={{ fontWeight: tab===t.ordem?700:500 }}>
                {t.ordem}
              </button>
            ))}
            {!row.tracks?.length && <span className="help">Status atual: {row.status}</span>}
          </div>

          {tab===1 && <S1 row={row} canEdit={can(["ANALISTA"])} onSaved={()=>{ toast("Status 1 salvo"); load(); }} />}
          {tab===2 && <S2 row={row} canEdit={can(["ANALISTA"])} onSaved={()=>{ toast("Status 2 avançado"); load(); }} />}
          {tab===3 && <S3 row={row} canEdit={can(["ANALISTA"])} onSaved={()=>{ toast("Status 3 salvo"); load(); }} />}
          {tab===4 && <S4 row={row} canEdit={can(["REQUISITOS"])} onSaved={()=>{ load(); }} />}
          {tab===5 && <S5 row={row} canEditSolic={can(["SOLICITANTE"])} canReturn={can(["REQUISITOS"])} onSaved={()=>{ load(); }} />}
          {tab===6 && <S6 row={row} canEdit={can(["REQUISITOS","ANALISTA"])} onSaved={()=>{ toast("Status 6 salvo"); load(); }} />}
          {tab>6 && <div className="help">Finalizada (7)</div>}
        </div>
      </div>

      {/* Acompanhamento */}
      <div className="card">
        <div className="card-h"><strong>Acompanhamento</strong></div>
        <div className="card-b grid" style={{ gap:8 }}>
          <div className="grid" style={{ gridTemplateColumns: "auto 1fr", gap: 8 }}>
            {row.logs.map((l:any)=>(
              <React.Fragment key={l.id}>
                <span className="badge">{new Date(l.ts).toLocaleString()}</span>
                <div className="help"><b>{l.user}</b> — {l.acao}</div>
              </React.Fragment>
            ))}
            {!row.logs.length && <div className="help">Sem registros</div>}
          </div>
          <Notes gmudId={row.id} onSaved={()=>{ toast("Observação registrada"); load(); }} />
        </div>
      </div>
    </div>
  );
}

function Info({label,value}:{label:string; value?:React.ReactNode}){
  return <div className="card"><div className="card-b"><div className="help">{label}</div><div style={{ fontWeight:600 }}>{value}</div></div></div>;
}

// ====== Forms ======

function S1({ row, canEdit, onSaved }:{ row:any; canEdit:boolean; onSaved:()=>void }){
  // estimativa por dev
  const devs: Link[] = (row.recursos || []).filter((l:Link)=> l.recurso?.tipo === "Desenvolvedor");
  const [vals, setVals] = useState<Record<number,string>>({});
  const save = async ()=>{
    const estimativas: Est[] = devs.map(d=>({ recursoId: d.recursoId, horas: vals[d.recursoId] || "" })).filter(e=>e.horas);
    if(!estimativas.length) return;
    await post(`/api/gmuds/${row.id}/form/1`, { estimativas });
    onSaved();
  };
  return <div className="grid" style={{ gap:12 }}>
    <div className="grid grid-3">
      {devs.map(d=>(
        <div key={d.recursoId}><label>{d.recurso?.nome}</label>
          <input className="input" type="time" value={vals[d.recursoId] || ""} onChange={e=>setVals(v=>({ ...v, [d.recursoId]: e.target.value }))} disabled={!canEdit}/>
        </div>
      ))}
    </div>
    {canEdit && <div style={{ display:"flex", justifyContent:"end" }}>
      <button className="btn accent" onClick={save}>Salvar</button>
    </div>}
  </div>;
}

function S2({ row, canEdit, onSaved }:{ row:any; canEdit:boolean; onSaved:()=>void }){
  const go = async ()=>{ await post(`/api/gmuds/${row.id}/form/2`, {}); onSaved(); };
  return <div style={{ display:"flex", justifyContent:"end" }}>
    {canEdit && <button className="btn accent" onClick={go}>AVANÇAR</button>}
  </div>;
}

function S3({ row, canEdit, onSaved }:{ row:any; canEdit:boolean; onSaved:()=>void }){
  const devs: Link[] = (row.recursos || []).filter((l:Link)=> l.recurso?.tipo === "Desenvolvedor");
  const [vals, setVals] = useState<Record<number,string>>({});
  const save = async ()=>{
    const gastos: Est[] = devs.map(d=>({ recursoId: d.recursoId, horas: vals[d.recursoId] || "" })).filter(e=>e.horas);
    if(!gastos.length) return;
    await post(`/api/gmuds/${row.id}/form/3`, { gastos });
    onSaved();
  };
  return <div className="grid" style={{ gap:12 }}>
    <div className="grid grid-3">
      {devs.map(d=>(
        <div key={d.recursoId}><label>{d.recurso?.nome}</label>
          <input className="input" type="time" value={vals[d.recursoId] || ""} onChange={e=>setVals(v=>({ ...v, [d.recursoId]: e.target.value }))} disabled={!canEdit}/>
        </div>
      ))}
    </div>
    {canEdit && <div style={{ display:"flex", justifyContent:"end" }}>
      <button className="btn accent" onClick={save}>Salvar</button>
    </div>}
  </div>;
}

function S4({ row, canEdit, onSaved }:{ row:any; canEdit:boolean; onSaved:()=>void }){
  const [tempo, setTempo] = useState("");
  const [file, setFile] = useState<File|null>(null);
  const [decisao, setDecisao] = useState<"aprovar"|"reprovar">("aprovar");
  const save = async ()=>{
    if (file) {
      const fd = new FormData();
      fd.append("files", file);
      await fetch(`/api/gmuds/${row.id}/upload?ordem=4`, { method:"POST", body: fd, credentials:"include" }).then(async r=>{ if(!r.ok) throw await r.json(); });
    }
    await post(`/api/gmuds/${row.id}/form/4`, { tempoTestes: tempo, decisao });
    onSaved();
  };
  return <div className="grid" style={{ gap:12 }}>
    <div className="grid grid-3">
      <div><label>Tempo Gasto com Testes</label><input className="input" type="time" value={tempo} onChange={e=>setTempo(e.target.value)} disabled={!canEdit}/></div>
      <div />
      <div />
    </div>
    <div><label>Documento de teste</label><input className="input" type="file" onChange={e=>setFile(e.target.files?.[0] || null)} disabled={!canEdit}/></div>
    <div><label>Decisão</label>
      <select className="input" value={decisao} onChange={e=>setDecisao(e.target.value as any)} disabled={!canEdit}>
        <option value="aprovar">Aprovar</option>
        <option value="reprovar">Reprovar</option>
      </select>
    </div>
    {canEdit && <div style={{ display:"flex", justifyContent:"end" }}>
      <button className="btn accent" onClick={save}>Salvar</button>
    </div>}
  </div>;
}

function S5({ row, canEditSolic, canReturn, onSaved }:{ row:any; canEditSolic:boolean; canReturn:boolean; onSaved:()=>void }){
  const [obs, setObs] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  useEffect(()=>{
    get<any>(`/api/gmuds/${row.id}`).then(r=>{
      setFiles((r.arquivos||[]).filter((a:any)=>a.statusOrdem===4));
    });
  },[row.id]);

  return <div className="grid" style={{ gap:12 }}>
    <div className="card">
      <div className="card-h"><strong>Documento de testes</strong></div>
      <div className="card-b">
        {files.length ? files.map((f:any)=>(
          <div key={f.id} style={{ marginBottom:8 }}>
            <a href={`/uploads/gmuds/${row.id}/4/${f.path.split("/").pop()}`} target="_blank" rel="noreferrer">{f.filename}</a>
          </div>
        )) : <div className="help">Nenhum anexo</div>}
      </div>
    </div>

    {canEditSolic && (
      <>
        <div><label>Observações</label><textarea className="input" rows={3} value={obs} onChange={e=>setObs(e.target.value)} /></div>
        <div style={{ display:"flex", justifyContent:"end" }}>
          <button className="btn accent" onClick={async()=>{ await post(`/api/gmuds/${row.id}/form/5`, { observacoes: obs, decisao: "aprovar" }); onSaved(); }}>Aprovar</button>
        </div>
      </>
    )}

    {canReturn && (
      <div style={{ display:"flex", justifyContent:"start" }}>
        <button className="btn" onClick={async()=>{ await post(`/api/gmuds/${row.id}/return-dev`, {}); onSaved(); }}>Retornar para desenvolvimento</button>
      </div>
    )}
  </div>;
}

function S6({ row, canEdit, onSaved }:{ row:any; canEdit:boolean; onSaved:()=>void }){
  const [dt, setDt] = useState("");
  const save = async ()=>{ await post(`/api/gmuds/${row.id}/form/6`, { dataGoLive: dt }); onSaved(); };
  return <div className="grid" style={{ gap:12 }}>
    <div className="grid grid-3">
      <div><label>Data Go Live</label><input className="input" type="date" value={dt} onChange={e=>setDt(e.target.value)} disabled={!canEdit}/></div>
    </div>
    {canEdit && <div style={{ display:"flex", justifyContent:"end" }}>
      <button className="btn accent" onClick={save}>Salvar</button>
    </div>}
  </div>;
}

function Notes({ gmudId, onSaved }:{ gmudId:number; onSaved:()=>void }){
  const [txt, setTxt] = useState("");
  return (
    <div className="grid" style={{ gap:8 }}>
      <div><label>Observações</label><textarea className="input" rows={3} value={txt} onChange={e=>setTxt(e.target.value)} /></div>
      <div style={{ display:"flex", justifyContent:"end" }}>
        <button className="btn" onClick={async()=>{ if(!txt.trim()) return; await post(`/api/gmuds/${gmudId}/notes`, { texto: txt }); setTxt(""); onSaved(); }}>Salvar</button>
      </div>
    </div>
  );
}
