import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";

const r = Router();

r.get("/", authRequired, async (_req, res) => {
  const rows = await prisma.recurso.findMany({ orderBy: { id: "desc" } });
  res.json(rows);
});

r.post("/", authRequired, async (req, res) => {
  const { nome, tipo } = req.body;
  const row = await prisma.recurso.create({ data: { nome, tipo } });
  res.json(row);
});

r.delete("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.recurso.delete({ where: { id } });
  res.json({ ok: true });
});

export default r;
