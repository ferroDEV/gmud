import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "./jwt";

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = (req as any).cookies?.token;
  if (!token) return res.status(401).json({ error: "unauthorized", message: "Token ausente." });
  const payload = verifyJWT(token);
  if (!payload) return res.status(401).json({ error: "unauthorized", message: "Token inválido ou expirado." });
  (req as any).user = payload;
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "unauthorized", message: "Sem autenticação." });
    if (user.role !== role && user.role !== "ADMIN") return res.status(403).json({ error: "forbidden", message: "Permissão negada." });
    next();
  };
}
