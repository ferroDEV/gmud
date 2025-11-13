import { Router } from "express";
import argon2 from "argon2";
import { prisma } from "../db/client";
import { signJWT } from "../auth/jwt";
import { authRequired } from "../auth/middleware";
import { authWithAD } from "../auth/ad";
import { z } from "zod";
import { resolveRoleFromCargoName } from "../helpers/roles";
import { getColaboradorByEmail } from "../helpers/users";

const r = Router();
const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

r.get("/me", authRequired, async (req, res) => {
  res.json({ user: (req as any).user });
});

r.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "validation_error", message: "Credenciais inválidas." });
  const { username, password } = parsed.data;

  // 1) Admin local (argon2) – mantém igual
  const localUser = await prisma.user.findUnique({ where: { username } });
  if (localUser?.isLocal && localUser.passwordHash) {
    const ok = await argon2.verify(localUser.passwordHash, password);
    if (!ok) return res.status(401).json({ error: "invalid_credentials", message: "Usuário ou senha inválidos." });

    const token = signJWT({
      uid: localUser.id,
      username: localUser.username,
      role: localUser.role,
      name: localUser.name,
      email: localUser.email || undefined,
      cargo: localUser.cargoNome || undefined,
      cpf: localUser.cpf || undefined,
      isRecurso: !!localUser.isRecurso
    });
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, { httpOnly: true, path: "/", sameSite: isProd ? "none" : "lax", secure: isProd });
    return res.json({ ok: true });
  }

  // 2) AD (ldapjs)
  const ad = await authWithAD(username, password);
  if (!ad.ok) return res.status(401).json({ error: ad.error || "ad_auth_failed", message: "Falha na autenticação AD." });

  // papel a partir do cargo (title)
  const papel = await resolveRoleFromCargoName(ad.title);

  // buscar CPF via email no SQL Server
  const colab = await getColaboradorByEmail(ad.email || "");
  let isRecurso = false;
  let cpf: string | undefined = colab?.cpf;

  if (cpf) {
    const rec = await prisma.recurso.findFirst({ where: { cpf } });
    isRecurso = !!rec;
  } else if (ad.name) {
    // fallback por nome se ainda não houver CPF cadastrado
    const recByName = await prisma.recurso.findFirst({
      where: { nome: { equals: ad.name, mode: "insensitive" } },
    });
    isRecurso = !!recByName;
  }

  // === garante registro do usuário no banco ===
  let user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username,
        name: ad.name || username,
        role: papel || "SOLICITANTE",
        isLocal: false,
        email: ad.email || null,
        cargoNome: ad.title || null,
        cpf: cpf || null,
        isRecurso
      },
    });
  } else {
    // se já existir, atualiza dados vindos do AD
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: ad.name || username,
        role: papel || user.role,
        email: ad.email || user.email,
        cargoNome: ad.title || user.cargoNome,
        cpf: cpf || user.cpf,
        isRecurso
      },
    });
  }

  // upsert do usuário
  const token = signJWT({
    uid: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email || undefined,
    cargo: user.cargoNome || undefined,
    cpf: user.cpf || undefined,
    isRecurso: !!user.isRecurso
  });

  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, { httpOnly: true, path: "/", sameSite: isProd ? "none" : "lax", secure: isProd });
  res.json({ ok: true });
});


r.post("/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

export default r;
