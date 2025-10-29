import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";

const r = Router();

r.get("/", authRequired, async (_req, res) => {
  const rows = await prisma.papel.findMany({ orderBy: { id: "desc" } });
  res.json(rows);
});

r.post("/", authRequired, async (req, res) => {
  const { nome } = req.body;
  const row = await prisma.papel.create({ data: { nome } });
  res.json(row);
});

r.delete("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.papel.delete({ where: { id } });
  res.json({ ok: true });
});

export default r;
