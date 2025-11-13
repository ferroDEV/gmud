import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { listCargos } from "../helpers/cargos";
import { prisma } from "../db/client";

const r = Router();

// GET /api/cargos?q=...
r.get("/", authRequired, async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const data = await listCargos(q);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: "mssql_error", message: "Falha ao listar cargos.", details: { message: e?.message } });
  }
});

// GET /api/cargos/with-roles  -> cargo + papel atribuído (default: SOLICITANTE)
r.get("/with-roles", authRequired, async (_req, res) => {
  try {
    const map = await prisma.papelCargo.findMany({ include: { papel: true } });
    const byId = new Map(map.map(m => [m.cargoId, m.papel?.nome || "SOLICITANTE"]));

    // carrega todos cargos do SQL Server
    const cargos = await listCargos();
    const out = cargos.map(c => ({
      id: c.id,
      nome: c.nome,
      papel: byId.get(c.id) || "SOLICITANTE",
    }));
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: "db_or_mssql_error", message: "Falha ao compor cargos e papéis.", details: { message: e?.message } });
  }
});

export default r;
