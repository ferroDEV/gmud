import { Router } from "express";
import argon2 from "argon2"; // <-- trocado
import { prisma } from "../db/client";
import { signJWT } from "../auth/jwt";
import { authRequired } from "../auth/middleware";
import { authWithAD } from "../auth/ad";

const r = Router();

r.get("/me", authRequired, async (req, res) => {
  res.json({ user: (req as any).user });
});

r.post("/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string; };
  if (!username || !password) return res.status(400).json({ error: "missing_credentials" });

  // 1) Local admin (argon2)
  const localUser = await prisma.user.findUnique({ where: { username } });
  if (localUser?.isLocal && localUser.passwordHash) {
    const ok = await argon2.verify(localUser.passwordHash, password); // <-- aqui
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });
    const token = signJWT({ uid: localUser.id, username: localUser.username, role: localUser.role, name: localUser.name });
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      path: "/",
      sameSite: isProd ? "none" : "lax",
      secure: isProd
    });
    return res.json({ ok: true });
  }

  // 2) AD
  const ad = await authWithAD(username, password);
  if (!ad.ok) return res.status(401).json({ error: "invalid_credentials" });

  const user = await prisma.user.upsert({
    where: { username },
    update: { name: ad.name!, role: ad.role || "SOLICITANTE", isLocal: false },
    create: { username, name: ad.name!, role: ad.role || "SOLICITANTE", isLocal: false },
  });

  const token = signJWT({ uid: user.id, username: user.username, role: user.role, name: user.name });
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    path: "/",
    sameSite: isProd ? "none" : "lax",
    secure: isProd
  });
  return res.json({ ok: true });
});

r.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

export default r;
