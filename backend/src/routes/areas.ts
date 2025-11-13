import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { listAreas } from "../helpers/areas";

const r = Router();

// GET /api/areas
r.get("/", authRequired, async (_req, res) => {
  try {
    const areas = await listAreas();
    res.json(areas);
  } catch (e: any) {
    res.status(500).json({ error: "mssql_error", message: "Falha ao listar áreas.", details: { message: e?.message } });
  }
});

export default r;
