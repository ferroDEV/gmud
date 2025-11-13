import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { listUsers, searchUsers } from "../helpers/users";

const r = Router();

// GET /api/users/search?q=...
r.get("/search", authRequired, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  try {
    const data = await searchUsers(q);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: "mssql_error", message: "Falha ao buscar usuários.", details: { message: e?.message } });
  }
});

// NOVO: GET /api/users/list?area=...
r.get("/list", authRequired, async (req, res) => {
  const area = req.query.area ? String(req.query.area) : undefined;
  try {
    const data = await listUsers(area);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: "mssql_error", message: "Falha ao listar usuários.", details: { message: e?.message } });
  }
});

export default r;
