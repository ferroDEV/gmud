import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";

const r = Router();

const CargoSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
});

const CreateSchema = z.object({
  nome: z.string().min(1),
  cargos: z.array(CargoSchema).default([]), // múltiplos cargos
});

r.get("/", authRequired, async (_req, res) => {
  try {
    const rows = await prisma.papel.findMany({
      orderBy: { nome: "asc" },
      include: { cargos: { select: { cargoId: true, cargoNome: true } } },
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: "db_error", message: "Falha ao listar papéis.", details: { message: e?.message } });
  }
});

r.post("/", authRequired, async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "validation_error", message: "Dados inválidos." });

  try {
    const papel = await prisma.papel.create({
      data: { nome: parsed.data.nome },
    });

    if (parsed.data.cargos.length) {
      await prisma.papelCargo.createMany({
        data: parsed.data.cargos.map((c) => ({
          cargoId: c.id,
          cargoNome: c.nome,
          papelId: papel.id,
        })),
        skipDuplicates: true,
      });
    }

    const full = await prisma.papel.findUnique({
      where: { id: papel.id },
      include: { cargos: { select: { cargoId: true, cargoNome: true } } },
    });
    res.json(full);
  } catch (e: any) {
    res.status(500).json({ error: "db_error", message: "Falha ao criar papel.", details: { message: e?.message } });
  }
});

r.patch("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);

  const UpdateSchema = z.object({
    nome: z.string().min(1).optional(),
    cargos: z.array(z.object({ id: z.string().min(1), nome: z.string().min(1) })).optional(),
  });

  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "validation_error", message: "Dados inválidos." });

  try {
    // valida existência
    const exists = await prisma.papel.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: "not_found", message: "Papel não encontrado." });

    // atualiza nome se enviado
    if (parsed.data.nome !== undefined) {
      await prisma.papel.update({ where: { id }, data: { nome: parsed.data.nome } });
    }

    // sincroniza cargos se enviados
    if (parsed.data.cargos !== undefined) {
      const desired = new Map(parsed.data.cargos.map(c => [c.id, c.nome]));

      const current = await prisma.papelCargo.findMany({
        where: { papelId: id },
        select: { cargoId: true, cargoNome: true },
      });
      const currentIds = new Set(current.map(c => c.cargoId));

      // remover os que não estão mais
      const toRemove = current.filter(c => !desired.has(c.cargoId)).map(c => c.cargoId);
      if (toRemove.length) {
        await prisma.papelCargo.deleteMany({ where: { papelId: id, cargoId: { in: toRemove } } });
      }

      // adicionar os novos
      const toAdd = [...desired.keys()].filter(cid => !currentIds.has(cid));
      if (toAdd.length) {
        // garante unicidade global do cargoId (um cargo só pode ter 1 papel)
        await prisma.papelCargo.deleteMany({ where: { cargoId: { in: toAdd } } });
        await prisma.papelCargo.createMany({
          data: toAdd.map(cid => ({
            cargoId: cid,
            cargoNome: desired.get(cid)!,
            papelId: id,
          })),
          skipDuplicates: true,
        });
      }
    }

    const full = await prisma.papel.findUnique({
      where: { id },
      include: { cargos: { select: { cargoId: true, cargoNome: true } } },
    });
    res.json(full);
  } catch (e: any) {
    res.status(500).json({ error: "db_error", message: "Falha ao atualizar papel.", details: { message: e?.message } });
  }
});


r.delete("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  try {
    // remove vínculos e o papel
    await prisma.papelCargo.deleteMany({ where: { papelId: id } });
    await prisma.papel.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: "db_error", message: "Falha ao excluir papel.", details: { message: e?.message } });
  }
});

export default r;
