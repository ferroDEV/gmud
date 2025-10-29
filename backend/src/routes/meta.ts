import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";

const r = Router();

// Fluxos de status (fixos) expostos ao frontend
r.get("/flows", authRequired, async (_req, res) => {
  const solicitacao = [
    { id: 1, titulo: "Análise de prioridade", papel: "REQUISITOS" },
    { id: 2, titulo: "Agendamento de entrevistas", papel: "REQUISITOS" },
    { id: 3, titulo: "Aprovação de processos", papel: "PROCESSOS" },
    { id: 4, titulo: "Formalização de requisitos", papel: "REQUISITOS" },
    { id: 5, titulo: "Aprovação de requisitos", papel: "SOLICITANTE" },
  ];
  const gmud = [
    { id: 1, titulo: "Análise de investimentos", papel: "ANALISTA" },
    { id: 2, titulo: "Fila de Desenvolvimento", papel: "ANALISTA" },
    { id: 3, titulo: "Desenvolvimento", papel: "ANALISTA" },
    { id: 4, titulo: "Homologação Interna", papel: "REQUISITOS" },
    { id: 5, titulo: "Homologação Solicitante", papel: "REQUISITOS" },
    { id: 6, titulo: "Go Live", papel: "ANALISTA" },
    { id: 7, titulo: "Finalizado", papel: "ANALISTA" },
  ];
  res.json({ solicitacao, gmud });
});

// Indicadores simples (contagens)
r.get("/metrics", authRequired, async (_req, res) => {
  const [sol, gm, rec] = await Promise.all([
    prisma.solicitacao.count(),
    prisma.gMUD.count(),
    prisma.recurso.count(),
  ]);
  res.json({ solicitacoes: sol, gmuds: gm, recursos: rec });
});

export default r;
