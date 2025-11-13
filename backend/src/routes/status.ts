import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";
import { z } from "zod";

const r = Router();
const StatusSchema = z.object({ nome: z.string().min(1), ordem: z.number().int().min(1), tipo: z.string().min(1) });

r.get("/", authRequired, async (_req, res) => {
  try {
    const rows = await prisma.statusCatalog.findMany({ orderBy: { ordem: "asc" } });
    res.json(rows);
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao listar status.", details: { message: e?.message } });
  }
});

r.post("/", authRequired, async (req, res) => {
  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "validation_error", message: "Dados inválidos." });
  try {
    const row = await prisma.statusCatalog.create({ data: parsed.data });
    res.json(row);
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao criar status.", details: { message: e?.message } });
  }
});

r.patch("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = StatusSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "validation_error", message: "Dados inválidos." });
  try {
    const row = await prisma.statusCatalog.update({ where: { id }, data: parsed.data });
    res.json(row);
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao atualizar status.", details: { message: e?.message } });
  }
});

r.delete("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.statusCatalog.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao excluir status.", details: { message: e?.message } });
  }
});

export default r;
