import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";

const r = Router();

r.get("/", authRequired, async (req, res) => {
  const rows = await prisma.solicitacao.findMany({
    orderBy: { id: "desc" },
    include: { solicitante: true, analistaRequisitos: true },
  });
  res.json(rows);
});

r.get("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const row = await prisma.solicitacao.findUnique({
    where: { id },
    include: {
      solicitante: true,
      analistaRequisitos: true,
      logs: { orderBy: { id: "desc" } },
      recursos: { include: { recurso: true } },
    },
  });
  if (!row) return res.status(404).json({ error: "not_found" });
  res.json(row);
});

r.post("/", authRequired, async (req, res) => {
  const { titulo, area, solicitanteId, analistaRequisitosId } = req.body;
  const row = await prisma.solicitacao.create({
    data: { titulo, area, solicitanteId, analistaRequisitosId, status: 1, dadosStatus: {} },
  });
  res.json(row);
});

r.patch("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const data: any = {};
  if (req.body.titulo) data.titulo = req.body.titulo;
  if (req.body.area) data.area = req.body.area;
  if (req.body.analistaRequisitosId !== undefined) data.analistaRequisitosId = req.body.analistaRequisitosId;
  const row = await prisma.solicitacao.update({ where: { id }, data });
  res.json(row);
});

r.post("/:id/transition", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { to, logMsg } = req.body as { to: number; logMsg?: string };
  const s = await prisma.solicitacao.findUnique({ where: { id } });
  if (!s) return res.status(404).json({ error: "not_found" });

  if (to === 999) {
    // cria GMUD
    const g = await prisma.gMUD.create({
      data: {
        titulo: `GMUD de ${s.titulo}`,
        solicitacaoId: s.id,
        solicitanteId: s.solicitanteId,
        analistaRequisitosId: s.analistaRequisitosId || null,
        status: 1,
        dadosStatus: {},
      },
    });
    await prisma.solicitacaoLog.create({ data: { solicitacaoId: s.id, user: "sistema", acao: "Aprovou requisitos e criou GMUD" } });
    return res.json({ createdGMUD: g });
  } else {
    const updated = await prisma.solicitacao.update({ where: { id }, data: { status: to } });
    await prisma.solicitacaoLog.create({ data: { solicitacaoId: s.id, user: "sistema", acao: logMsg || `Avançou para ${to}` } });
    return res.json(updated);
  }
});

export default r;
