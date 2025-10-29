import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";

const r = Router();

r.get("/", authRequired, async (_req, res) => {
  const rows = await prisma.gMUD.findMany({
    orderBy: { id: "desc" },
    include: { solicitante: true, analistaRequisitos: true },
  });
  res.json(rows);
});

r.get("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const row = await prisma.gMUD.findUnique({
    where: { id },
    include: { solicitante: true, analistaRequisitos: true, logs: { orderBy: { id: "desc" } }, recursos: { include: { recurso: true } } },
  });
  if (!row) return res.status(404).json({ error: "not_found" });
  res.json(row);
});

r.patch("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const data: any = {};
  if (req.body.titulo) data.titulo = req.body.titulo;
  if (req.body.analistaRequisitosId !== undefined) data.analistaRequisitosId = req.body.analistaRequisitosId;
  if (req.body.status !== undefined) data.status = req.body.status;
  if (req.body.dadosStatus !== undefined) data.dadosStatus = req.body.dadosStatus;
  const row = await prisma.gMUD.update({ where: { id }, data });
  res.json(row);
});

r.post("/:id/transition", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { to } = req.body as { to: number };
  const g = await prisma.gMUD.update({ where: { id }, data: { status: to } });
  await prisma.gMUDLog.create({ data: { gmudId: id, user: "sistema", acao: `Mudou para ${to}` } });
  res.json(g);
});

export default r;
