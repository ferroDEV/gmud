import React, { useEffect, useMemo, useState } from "react";
import { ApiError, get, post } from "../../lib/api";
import { useParams } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { toast } from "../../components/Toast";

type Row = any;
type Recurso = { id:number; nome:string; tipo:string };
type KeyUser = { id:number; name:string; area:string };

export default function DetalheSolicitacao(){
  const { id } = useParams();
  const { user } = useAuth();
  const [row, setRow] = useState<Row | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<number>(1);

  const load = () => {
    get<Row>(`/api/solicitacoes/${id}`).then((r)=>{
      setRow(r);
      const reached = (r?.tracks || []).map((t:any)=>t.ordem);
      setTab(reached.length ? reached[reached.length-1] : r.status || 1);
    }).catch((e:ApiError)=> setErr(e.message||e.error));
  };
  useEffect(()=>{ load(); },[id]);

  if(err) return <div className="alert">{err}</div>;
  if(!row) return <div className="help">Carregando...</div>;

  const canEdit = (requiredRole: string) => user?.role === requiredRole || user?.role === "ADMIN";

  return (
    <div className="grid" style={{ gap: 16 }}>
      {/* Box principal */}
      <div className="card">
        <div className="card-h"><strong>Solicitação #{row.id} — {row.titulo}</strong><div className="help">Criada em {new Date(row.createdAt).toLocaleString()}</div></div>
        <div className="card-b grid grid-3">
          <Info label="Área" value={row.area} />
          <Info label="Solicitante" value={row.solicitante?.name} />
          <Info label="Analista Requisitos" value={row.analistaRequisitos?.name || "—"} />
          <div style={{ gridColumn:"1 / -1", display:"flex", gap:8, flexWrap:"wrap" }}>
            <button className="btn" onClick={async ()=>{
              const valor = prompt("Novo ID do solicitante:");
              if(!valor) return;
              await post(`/api/solicitacoes/${row.id}/assign`, { solicitanteId: Number(valor) });
              toast("Solicitante alterado"); load();
            }}>ALTERAR SOLICITANTE</button>
            <button className="btn" onClick={async ()=>{
              const valor = prompt("Novo ID do desenvolvedor (Recurso):");
              if(!valor) return;
              await post(`/api/solicitacoes/${row.id}/assign`, { desenvolvedorId: Number(valor) });
              toast("Desenvolvedor alterado"); load();
            }}>ALTERAR DESENVOLVEDOR</button>
            <button className="btn" onClick={async ()=>{
              const valor = prompt("Novo ID do Analista de Requisitos:");
              if(!valor) return;
              await post(`/api/solicitacoes/${row.id}/assign`, { analistaRequisitosId: Number(valor) });
              toast("Analista de Requisitos alterado"); load();
            }}>ALTERAR ANALISTA REQUISITOS</button>
            <button className="btn destructive" onClick={async ()=>{
              const motivo = prompt("Motivo do cancelamento:\n1) Solicitação duplicada\n2) Mudança de prioridade\n3) Escopo incorreto");
              if(!motivo) return;
              await post(`/api/solicitacoes/${row.id}/cancel`, { motivo });
              toast("Solicitação cancelada"); load();
            }}>CANCELAR SOLICITAÇÃO</button>
          </div>
        </div>
      </div>

      {/* Abas de status */}
      <div className="card">
        <div className="card-h"><strong>Fluxo — Tipo SOLICITAÇÃO</strong></div>
        <div className="card-b">
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom: 12 }}>
            {(row.tracks || []).map((t:any)=>(
              <button key={t.id} className="btn" onClick={()=>setTab(t.ordem)} style={{ fontWeight: tab===t.ordem?700:500 }}>
                {t.ordem}
              </button>
            ))}
            {!row.tracks?.length && <span className="help">Status atual: {row.status}</span>}
          </div>

          {tab===1 && <Status1 solicitacaoId={row.id} canEdit={canEdit("REQUISITOS")} onSaved={()=>{ toast("Status 1 salvo"); load(); }} />}
          {tab===2 && <Status2 solicitacaoId={row.id} canEdit={canEdit("REQUISITOS")} onSaved={()=>{ toast("Status 2 salvo"); load(); }} />}
          {tab===3 && <Status3 solicitacaoId={row.id} canEdit={canEdit("PROCESSOS")} onSaved={()=>{ load(); }} />}
          {tab===4 && <Status4 solicitacaoId={row.id} canEdit={canEdit("REQUISITOS")} onSaved={()=>{ toast("Status 4 salvo"); load(); }} />}
          {tab===5 && <Status5 solicitacaoId={row.id} canEdit={canEdit("SOLICITANTE")} onSaved={()=>{ load(); }} />}
          {tab>5 && <div className="help">Finalizada (6)</div>}
        </div>
      </div>

      {/* Acompanhamento */}
      <div className="card">
        <div className="card-h"><strong>Acompanhamento</strong></div>
        <div className="card-b grid" style={{ gap: 8 }}>
          <div className="grid" style={{ gridTemplateColumns: "auto 1fr", gap: 8 }}>
            {row.logs.map((l:any)=>(
              <React.Fragment key={l.id}>
                <span className="badge">{new Date(l.ts).toLocaleString()}</span>
                <div className="help"><b>{l.user}</b> — {l.acao}</div>
              </React.Fragment>
            ))}
            {!row.logs.length && <div className="help">Sem registros</div>}
          </div>
          <Observacao solicitacaoId={row.id} onSaved={()=>{ toast("Observação registrada"); load(); }} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }:{ label:string; value?:React.ReactNode }) {
  return <div className="card"><div className="card-b"><div className="help">{label}</div><div style={{ fontWeight: 600 }}>{value}</div></div></div>;
}

// ====== Forms por status ======

function Status1({ solicitacaoId, canEdit, onSaved }: { solicitacaoId: number; canEdit: boolean; onSaved: () => void }) {
  const [devs, setDevs] = useState<Recurso[]>([]);
  const [reqs, setReqs] = useState<Recurso[]>([]);
  const [devIds, setDevIds] = useState<number[]>([]);
  const [reqId, setReqId] = useState<number | null>(null);
  const [pespro, setPespro] = useState("Baixo");
  const [pint, setPint] = useState("Baixo");
  const [err, setErr] = useState<string | null>(null);

  // carrega desenvolvedores e analistas de requisitos (Negócios)
  useEffect(() => {
    get<Recurso[]>("/api/recursos?tipo=Desenvolvedor")
      .then(setDevs)
      .catch(() => setDevs([]));
    get<Recurso[]>("/api/recursos?tipo=Negócios")
      .then(setReqs)
      .catch(() => setReqs([]));
  }, []);

  const toggleDev = (id: number) => {
    setDevIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectReq = (id: number) => {
    setReqId((prev) => (prev === id ? null : id)); // só um pode ser selecionado
  };

  const save = async () => {
    setErr(null);
    try {
      if (!devIds.length) return setErr("Selecione ao menos um desenvolvedor.");
      if (!reqId) return setErr("Selecione o analista de requisitos.");
      await post(`/api/solicitacoes/${solicitacaoId}/form/1`, {
        desenvolvedorIds: devIds,
        requisitosId: reqId,
        prioridadeEspro: pespro,
        prioridadeInterna: pint,
      });
      onSaved();
    } catch (e: any) {
      setErr((e as ApiError).message || "Erro ao salvar status 1.");
    }
  };

  return (
    <div className="grid" style={{ gap: 12 }}>
      {err && <div className="alert">{err}</div>}

      <div style={{ gridColumn: "1 / -1" }}>
        <label>Desenvolvedores</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {devs.map((d) => (
            <label
              key={d.id}
              className="badge"
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              <input
                type="checkbox"
                checked={devIds.includes(d.id)}
                onChange={() => toggleDev(d.id)}
                disabled={!canEdit}
              />
              <span style={{ marginLeft: 6 }}>{d.nome}</span>
            </label>
          ))}
          {!devs.length && <span className="help">Nenhum desenvolvedor disponível.</span>}
        </div>
      </div>

      <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
        <label>Analista de Requisitos</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {reqs.map((r) => (
            <label
              key={r.id}
              className="badge"
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              <input
                type="radio"
                name="analistaRequisito"
                checked={reqId === r.id}
                onChange={() => selectReq(r.id)}
                disabled={!canEdit}
              />
              <span style={{ marginLeft: 6 }}>{r.nome}</span>
            </label>
          ))}
          {!reqs.length && <span className="help">Nenhum analista disponível.</span>}
        </div>
      </div>

      <div className="grid grid-3">
        <div>
          <label>Prioridade Espro</label>
          <select
            className="input"
            value={pespro}
            onChange={(e) => setPespro(e.target.value)}
            disabled={!canEdit}
          >
            {["Baixo", "Média", "Alta", "Urgente"].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Prioridade Interna</label>
          <select
            className="input"
            value={pint}
            onChange={(e) => setPint(e.target.value)}
            disabled={!canEdit}
          >
            {["Baixo", "Média", "Alta", "Urgente"].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canEdit && (
        <div style={{ display: "flex", justifyContent: "end" }}>
          <button className="btn accent" onClick={save}>
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}


function Status2({ solicitacaoId, canEdit, onSaved }:{ solicitacaoId:number; canEdit:boolean; onSaved: ()=>void }){
  const [data, setData] = useState("");
  const [tempo, setTempo] = useState("");
  const [files, setFiles] = useState<FileList|null>(null);
  const [err, setErr] = useState<string|null>(null);

  const save = async ()=>{
    setErr(null);
    try{
      const fd = new FormData();
      if(files) Array.from(files).forEach(f => fd.append("files", f));
      await fetch(`/api/solicitacoes/${solicitacaoId}/upload?ordem=2`, { method:"POST", body: fd, credentials:"include" }).then(async r=>{ if(!r.ok) throw await r.json(); });
      await post(`/api/solicitacoes/${solicitacaoId}/form/2`, { dataInicialEntrevista: data, tempoGastoEntrevista: tempo });
      onSaved();
    }catch(e:any){ setErr((e as ApiError).message || "Erro"); }
  };

  return <div className="grid" style={{ gap: 12 }}>
    {err && <div className="alert">{err}</div>}
    <div className="grid grid-3">
      <div><label>Data Inicial Entrevista</label><input className="input" type="date" value={data} onChange={e=>setData(e.target.value)} disabled={!canEdit}/></div>
      <div><label>Tempo Gasto com Entrevista</label><input className="input" type="time" value={tempo} onChange={e=>setTempo(e.target.value)} disabled={!canEdit}/></div>
      <div />
    </div>
    <div>
      <label>Arquivos</label>
      <input className="input" type="file" multiple onChange={e=>setFiles(e.target.files)} disabled={!canEdit}/>
    </div>
    {canEdit && <div style={{ display:"flex", justifyContent:"end" }}>
      <button className="btn accent" onClick={save}>Salvar</button>
    </div>}
  </div>;
}

function Status3({ solicitacaoId, canEdit, onSaved }:{ solicitacaoId:number; canEdit:boolean; onSaved: ()=>void }){
  const [obs, setObs] = useState("");
  const [err, setErr] = useState<string|null>(null);
  const send = async (decisao:"aprovar"|"reprovar")=>{
    setErr(null);
    try{
      await post(`/api/solicitacoes/${solicitacaoId}/form/3`, { observacoes: obs, decisao });
      onSaved();
    }catch(e:any){ setErr((e as ApiError).message || "Erro"); }
  };
  return <div className="grid" style={{ gap: 12 }}>
    {err && <div className="alert">{err}</div>}
    <div><label>Observações</label><textarea className="input" rows={4} value={obs} onChange={e=>setObs(e.target.value)} disabled={!canEdit}/></div>
    {canEdit && <div style={{ display:"flex", gap:8, justifyContent:"end" }}>
      <button className="btn destructive" onClick={()=>send("reprovar")}>Reprovar</button>
      <button className="btn accent" onClick={()=>send("aprovar")}>Aprovar</button>
    </div>}
  </div>;
}

function Status4({ solicitacaoId, canEdit, onSaved }:{ solicitacaoId:number; canEdit:boolean; onSaved: ()=>void }){
  const [tempo, setTempo] = useState("");
  const [data, setData] = useState("");
  const [file, setFile] = useState<File|null>(null);
  const [users, setUsers] = useState<KeyUser[]>([]);
  const [selUsers, setSelUsers] = useState<number[]>([]);
  const [err, setErr] = useState<string|null>(null);

  useEffect(()=>{
    get<KeyUser[]>(`/api/solicitacoes/${solicitacaoId}/key-users`).then(setUsers).catch(()=>setUsers([]));
  },[solicitacaoId]);

  const save = async ()=>{
    setErr(null);
    try{
      if(file){
        const fd = new FormData();
        fd.append("files", file);
        await fetch(`/api/solicitacoes/${solicitacaoId}/upload?ordem=4`, { method:"POST", body: fd, credentials:"include" }).then(async r=>{ if(!r.ok) throw await r.json(); });
      }
      const usuariosChave = users.filter(u=>selUsers.includes(u.id));
      await post(`/api/solicitacoes/${solicitacaoId}/form/4`, { tempoGastoRequisitos: tempo, dataFimRequisitos: data });
      onSaved();
    }catch(e:any){ setErr((e as ApiError).message || "Erro"); }
  };

  return <div className="grid" style={{ gap: 12 }}>
    {err && <div className="alert">{err}</div>}
    <div className="grid grid-3">
      <div><label>Tempo Gasto com Requisitos</label><input className="input" type="time" value={tempo} onChange={e=>setTempo(e.target.value)} disabled={!canEdit}/></div>
      <div><label>Data Fim Requisitos</label><input className="input" type="date" value={data} onChange={e=>setData(e.target.value)} disabled={!canEdit}/></div>
      <div />
    </div>
    <div><label>Anexo de Requisitos</label><input className="input" type="file" onChange={e=>setFile(e.target.files?.[0] || null)} disabled={!canEdit}/></div>
    {canEdit && <div style={{ display:"flex", justifyContent:"end" }}>
      <button className="btn accent" onClick={save}>Salvar</button>
    </div>}
  </div>;
}

function Status5({ solicitacaoId, canEdit, onSaved }:{ solicitacaoId:number; canEdit:boolean; onSaved: ()=>void }){
  const [err, setErr] = useState<string|null>(null);
  const [files, setFiles] = useState<any[]>([]);
  useEffect(()=>{
    get<any>(`/api/solicitacoes/${solicitacaoId}`).then(r=>{
      const all = r.arquivos || [];
      setFiles(all.filter((a:any)=>a.statusOrdem===4));
    });
  },[solicitacaoId]);

  const send = async (decisao:"aprovar"|"reprovar")=>{
    setErr(null);
    try{
      await post(`/api/solicitacoes/${solicitacaoId}/form/5`, { decisao });
      onSaved();
      toast(decisao==="aprovar" ? "Aprovado" : "Reprovado");
    }catch(e:any){ setErr((e as ApiError).message || "Erro"); }
  };

  return <div className="grid" style={{ gap: 12 }}>
    {err && <div className="alert">{err}</div>}
    <div className="card">
      <div className="card-h"><strong>Documento de Requisitos</strong></div>
      <div className="card-b">
        {files.length ? files.map(f=>(<div key={f.id} style={{ marginBottom: 8 }}>
          <a href={`/uploads/solicitacoes/${solicitacaoId}/4/${f.path.split("/").pop()}`} target="_blank" rel="noreferrer">{f.filename}</a>
        </div>)) : <div className="help">Nenhum anexo disponível.</div>}
      </div>
    </div>
    {canEdit && <div style={{ display:"flex", gap:8, justifyContent:"end" }}>
      <button className="btn destructive" onClick={()=>send("reprovar")}>Reprovar</button>
      <button className="btn accent" onClick={()=>send("aprovar")}>Aprovar</button>
    </div>}
  </div>;
}

function Observacao({ solicitacaoId, onSaved }:{ solicitacaoId:number; onSaved: ()=>void }){
  const [txt, setTxt] = useState("");
  return (
    <div className="grid" style={{ gap: 8 }}>
      <div><label>Observações</label><textarea className="input" rows={3} value={txt} onChange={e=>setTxt(e.target.value)} /></div>
      <div style={{ display:"flex", justifyContent:"end" }}>
        <button className="btn" onClick={async ()=>{ if(!txt.trim()) return; await post(`/api/solicitacoes/${solicitacaoId}/notes`, { texto: txt }); setTxt(""); onSaved(); }}>Salvar</button>
      </div>
    </div>
  );
}
