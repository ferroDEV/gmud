import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";

const r = Router();

r.get("/", authRequired, async (_req, res) => {
  const rows = await prisma.statusCatalog.findMany({ orderBy: { ordem: "asc" } });
  res.json(rows);
});

r.post("/", authRequired, async (req, res) => {
  const { nome, ordem } = req.body;
  const row = await prisma.statusCatalog.create({ data: { nome, ordem } });
  res.json(row);
});

r.patch("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { nome, ordem } = req.body;
  const row = await prisma.statusCatalog.update({ where: { id }, data: { nome, ordem } });
  res.json(row);
});

r.delete("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.statusCatalog.delete({ where: { id } });
  res.json({ ok: true });
});

export default r;
