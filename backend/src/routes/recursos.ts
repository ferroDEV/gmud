import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";
import { z } from "zod";

const r = Router();
const RecursoSchema = z.object({
  nome: z.string().min(1),
  tipo: z.enum(["DESENVOLVEDOR","NEGÓCIOS"]),            
  areaNegocio: z.string().min(1),
  cpf: z.string().min(11).max(14).optional()
});
r.get("/", authRequired, async (req, res) => {
  try {
    const tipo = req.query.tipo ? String(req.query.tipo) : undefined; // "Desenvolvedor" | "Negócios"
    const where = tipo ? { tipo } as any : {};
    const rows = await prisma.recurso.findMany({
      where,
      orderBy: { nome: "asc" }
    });
    res.json(rows);
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao listar recursos.", details: { message: e?.message } });
  }
});

r.post("/", authRequired, async (req, res) => {
  const parsed = RecursoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "validation_error", message: "Dados inválidos." });
  try {
    const row = await prisma.recurso.create({ data: parsed.data });
    res.json(row);
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao criar recurso.", details: { message: e?.message } });
  }
});

r.delete("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.recurso.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao excluir recurso.", details: { message: e?.message } });
  }
});

export default r;
