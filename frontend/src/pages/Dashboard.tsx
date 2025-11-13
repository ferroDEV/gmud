import React, { useEffect, useState } from "react";
import { get } from "../lib/api";
import Sparkline from "../components/charts/Sparkline";
import Bars from "../components/charts/Bars";
import Donut from "../components/charts/Donut";
import { toast } from "../components/Toast";

export default function Dashboard(){
  const [metrics, setMetrics] = useState<{ solicitacoes:number; gmuds:number; recursos:number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(()=>{
    get("/api/meta/metrics").then(setMetrics).catch((e)=>{
      setErr(e?.message || "Falha ao carregar métricas");
      toast("Erro ao carregar métricas");
    });
  },[]);

  const line = [12, 18, 10, 22, 17, 28, 24, 30];
  const bars = [22, 40, 31, 55, 44];
  const pie = [
    { label: "Concluídas", value: 18, color: "#16a34a" },
    { label: "Em andamento", value: 9, color: "#2563eb" },
    { label: "Pendentes", value: 4, color: "#f59e0b" },
  ];

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="grid grid-3">
        <KPI title="Solicitações" value={metrics?.solicitacoes ?? 0} />
        <KPI title="GMUDs" value={metrics?.gmuds ?? 0} />
        <KPI title="Recursos" value={metrics?.recursos ?? 0} />
      </div>

      <div className="card">
        <div className="card-h"><strong>Indicadores</strong><div className="help">Exemplos em SVG</div></div>
        <div className="card-b grid grid-3">
          <div><div className="help" style={{ marginBottom: 6 }}>Throughput semanal</div><Sparkline data={line} /></div>
          <div><div className="help" style={{ marginBottom: 6 }}>Tempo médio até Go Live</div><Bars data={bars} /></div>
          <div><div className="help" style={{ marginBottom: 6 }}>Distribuição de status</div><Donut data={pie} /></div>
        </div>
        {err && <div className="card-b"><div className="alert">{err}</div></div>}
      </div>
    </div>
  );
}
function KPI({ title, value }:{ title:string; value:number }){
  return (
    <div className="card">
      <div className="card-h">{title}</div>
      <div className="card-b"><div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div></div>
    </div>
  );
}
