import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";
import { sendMail } from "../helpers/mail";

const r = Router();
const TIPO = "GMUD";

// uploads
const uploadDir = path.resolve("uploads/gmuds");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const id = String(req.params.id || "misc");
    const ordem = String(req.query.ordem || "0");
    const dest = path.join(uploadDir, id, ordem);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, `${ts}_${safe}`);
  }
});
const uploader = multer({ storage });

function requireRole(req: any, roles: string[]) {
  const r = req.user?.role;
  if (r === "ADMIN") return;
  if (!roles.includes(r)) throw Object.assign(new Error("Permissão negada."), { status: 403 });
}

async function appendLog(gmudId: number, user: string, acao: string) {
  await prisma.gMUDLog.create({ data: { gmudId, user, acao } });
}

async function openTrack(gmudId: number, ordem: number) {
  const current = await prisma.gMUDStatusTrack.findFirst({
    where: { gmudId, tipo: TIPO, dataFim: null },
    orderBy: { id: "desc" }
  });
  if (current) {
    await prisma.gMUDStatusTrack.update({
      where: { id: current.id },
      data: { dataFim: new Date() }
    });
  }
  return prisma.gMUDStatusTrack.create({
    data: { gmudId, ordem, tipo: TIPO, dados: {} }
  });
}

async function ensureTrack(gmudId: number, ordem: number) {
  const ex = await prisma.gMUDStatusTrack.findFirst({ where: { gmudId, tipo: TIPO, ordem } });
  if (!ex) await prisma.gMUDStatusTrack.create({ data: { gmudId, ordem, tipo: TIPO, dados: {} } });
}

// ===== Schemas =====
const S1 = z.object({
  estimativas: z.array(z.object({ recursoId: z.number().int(), horas: z.string().min(1) })).min(1)
});
const S3 = z.object({
  gastos: z.array(z.object({ recursoId: z.number().int(), horas: z.string().min(1) })).min(1)
});
const S4 = z.object({
  tempoTestes: z.string().min(1),
  decisao: z.enum(["aprovar","reprovar"])
});
const S5 = z.object({
  observacoes: z.string().optional(),
  decisao: z.enum(["aprovar"]) // só aprova aqui; retorno para dev é endpoint separado
});
const S6 = z.object({
  dataGoLive: z.string().min(1) // ISO
});

// ===== LISTAR TODAS AS GMUDS =====
r.get("/", authRequired, async (_req, res) => {
  try {
    const list = await prisma.gMUD.findMany({
      include: {
        solicitante: { select: { name: true } },
        analistaRequisitos: { select: { name: true } },
      },
      orderBy: { id: "desc" },
    });
    res.json(list);
  } catch (e: any) {
    res.status(500).json({
      error: "db_error",
      message: "Falha ao listar GMUDs.",
      details: { message: e?.message },
    });
  }
});

// ===== GET =====
r.get("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const g = await prisma.gMUD.findUnique({
      where: { id },
      include: {
        solicitante: true,
        recursos: { include: { recurso: true } },
        tracks: { where: { tipo: TIPO }, orderBy: { ordem: "asc" } },
        arquivos: true,
        logs: { orderBy: { id: "desc" } }
      }
    });
    if (!g) return res.status(404).json({ error: "not_found", message: "GMUD não encontrada." });
    res.json(g);
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao carregar GMUD.", details: { message: e?.message } });
  }
});

// ===== STATUS 1 =====
r.post("/:id/form/1", authRequired, async (req:any, res) => {
  try {
    requireRole(req, ["ANALISTA"]);
    const id = Number(req.params.id);
    const body = S1.parse(req.body);

    await ensureTrack(id, 1);
    await prisma.gMUDStatusTrack.updateMany({
      where: { gmudId: id, ordem: 1, tipo: TIPO },
      data: { dados: body }
    });

    await appendLog(id, req.user?.username || "sistema", "Status 1 preenchido (estimativas)");
    await prisma.gMUD.update({ where: { id }, data: { status: 2 } });
    await openTrack(id, 2);
    res.json({ ok: true, next: 2 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status1_error", message: e.message || "Falha no status 1." });
  }
});

// ===== STATUS 2 (apenas avançar) =====
r.post("/:id/form/2", authRequired, async (req:any, res) => {
  try {
    requireRole(req, ["ANALISTA"]);
    const id = Number(req.params.id);
    await appendLog(id, req.user?.username || "sistema", "Status 2 avançado");
    await prisma.gMUD.update({ where: { id }, data: { status: 3 } });
    await openTrack(id, 3);
    res.json({ ok: true, next: 3 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status2_error", message: e.message || "Falha no status 2." });
  }
});

// ===== STATUS 3 (gastos por DEV – precisa de todos) =====
r.post("/:id/form/3", authRequired, async (req:any, res) => {
  try {
    requireRole(req, ["ANALISTA"]);
    const id = Number(req.params.id);
    const body = S3.parse(req.body);

    // registra acumulado
    const t3 = await prisma.gMUDStatusTrack.findFirst({ where: { gmudId: id, ordem: 3, tipo: TIPO } });
    if (!t3) await ensureTrack(id, 3);

    // merge com dados anteriores
    const current = await prisma.gMUDStatusTrack.findFirst({ where: { gmudId: id, ordem: 3, tipo: TIPO } });
    const prev = (current?.dados as any) || { gastos: [] };
    const map = new Map<number, string>(prev.gastos?.map((g:any)=> [g.recursoId, g.horas]) || []);
    for (const g of body.gastos) map.set(g.recursoId, g.horas);
    const merged = { gastos: Array.from(map.entries()).map(([recursoId, horas])=>({ recursoId, horas })) };

    await prisma.gMUDStatusTrack.updateMany({
      where: { gmudId: id, ordem: 3, tipo: TIPO },
      data: { dados: merged }
    });

    // checa se todos DEV preencheram
    const links = await prisma.gMUDRecurso.findMany({ where: { gmudId: id }, include: { recurso: true } });
    const devIds = links.filter(l => l.recurso?.tipo === "Desenvolvedor").map(l => l.recursoId);
    const filled = new Set(merged.gastos.map((g:any)=> g.recursoId));
    const allOk = devIds.every(did => filled.has(did));

    await appendLog(id, req.user?.username || "sistema", `Status 3 salvo (${merged.gastos.length}/${devIds.length})`);

    if (!allOk) return res.json({ ok: true, pending: devIds.filter(d=>!filled.has(d)) });

    // avança ao 4 e notifica recursos NEGÓCIOS
    await prisma.gMUD.update({ where: { id }, data: { status: 4 } });
    await openTrack(id, 4);

    const negocios = links.filter(l => l.recurso?.tipo === "Negócios").map(l => l.recursoId);
    if (negocios.length) {
      const recs = await prisma.recurso.findMany({ where: { id: { in: negocios } } });
      const users  = await prisma.user.findMany({
        where: {
          OR: [
            { cpf: { in: recs.map(r=> r.cpf).filter(Boolean) as string[] } },
            ...recs.map(r=> ({ name: { equals: r.nome, mode: "insensitive" as any } }))
          ]
        },
        select: { email: true }
      });
      const tos = Array.from(new Set(users.map(u=>u.email).filter(Boolean))) as string[];
      if (tos.length) {
        await sendMail({ to: tos, subject: `GMUD #${id} — Início de testes (status 4)`, html: `<p>Favor executar testes.</p>` });
      }
    }

    res.json({ ok: true, next: 4 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status3_error", message: e.message || "Falha no status 3." });
  }
});

// ===== upload (status 4 doc de teste – único) =====
r.post("/:id/upload", authRequired, uploader.array("files", 10), async (req:any, res) => {
  try {
    const id = Number(req.params.id);
    const ordem = parseInt(String(req.query.ordem || "0"), 10);
    if (![4].includes(ordem)) return res.status(400).json({ error: "invalid_ordem", message: "Apenas status 4." });
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) return res.status(400).json({ error: "no_files", message: "Sem arquivos." });

    // único no status 4
    await prisma.gMUDArquivo.deleteMany({ where: { gmudId: id, statusOrdem: 4 } });

    const created = await prisma.gMUDArquivo.create({
      data: {
        gmudId: id,
        statusOrdem: 4,
        filename: files[0].originalname,
        path: files[0].path,
        mime: files[0].mimetype,
        size: files[0].size,
        uploadedBy: req.user?.username || "sistema"
      }
    });

    await appendLog(id, req.user?.username || "sistema", `Upload status 4: ${created.filename}`);
    res.json(created);
  } catch (e:any) {
    res.status(500).json({ error: "upload_error", message: e.message || "Falha no upload." });
  }
});

// ===== STATUS 4 (REQUISITOS aprova/reprova) =====
r.post("/:id/form/4", authRequired, async (req:any, res) => {
  try {
    requireRole(req, ["REQUISITOS"]);
    const id = Number(req.params.id);
    const body = S4.parse(req.body);

    await ensureTrack(id, 4);
    await prisma.gMUDStatusTrack.updateMany({
      where: { gmudId: id, ordem: 4, tipo: TIPO },
      data: { dados: { tempoTestes: body.tempoTestes, decisao: body.decisao } }
    });

    await appendLog(id, req.user?.username || "sistema", `Status 4: ${body.decisao.toUpperCase()}`);

    if (body.decisao === "reprovar") {
      // volta ao 3 e notifica DEV
      await prisma.gMUD.update({ where: { id }, data: { status: 3 } });
      await openTrack(id, 3);

      const links = await prisma.gMUDRecurso.findMany({ where: { gmudId: id }, include: { recurso: true } });
      const devs = links.filter(l => l.recurso?.tipo === "Desenvolvedor").map(l => l.recursoId);
      if (devs.length) {
        const recs = await prisma.recurso.findMany({ where: { id: { in: devs } } });
        const users  = await prisma.user.findMany({
          where: {
            OR: [
              { cpf: { in: recs.map(r=> r.cpf).filter(Boolean) as string[] } },
              ...recs.map(r=> ({ name: { equals: r.nome, mode: "insensitive" as any } }))
            ]
          },
          select: { email: true }
        });
        const tos = Array.from(new Set(users.map(u=>u.email).filter(Boolean))) as string[];
        if (tos.length) await sendMail({ to: tos, subject: `GMUD #${id} — Retornou ao desenvolvimento (status 3)`, html: `<p>GMUD reprovada em testes.</p>` });
      }

      return res.json({ ok: true, next: 3 });
    }

    // aprovada -> 5 e notifica solicitante + usuários-chave (da solicitação)
    await prisma.gMUD.update({ where: { id }, data: { status: 5 } });
    await openTrack(id, 5);

    const g = await prisma.gMUD.findUnique({ where: { id }, include: { solicitante: true, solicitacao: true } });
    const anexos = await prisma.gMUDArquivo.findMany({ where: { gmudId: id, statusOrdem: 4 }, orderBy: { id: "desc" } });
    const attach = anexos[0] ? [{ filename: anexos[0].filename, path: anexos[0].path }] : [];

    const to: string[] = [];
    if (g?.solicitante?.email) to.push(g.solicitante.email);

    // pega usuários-chave da solicitação (status 4)
    if (g?.solicitacaoId) {
      const t4 = await prisma.solicitacaoStatusTrack.findFirst({ where: { solicitacaoId: g.solicitacaoId, ordem: 4, tipo: "SOLICITAÇÃO" } });
      const dados = (t4?.dados as any) || {};
      const usersKey = (dados.usuariosChave || []) as { id:number; name:string; area?:string }[];
      if (usersKey.length) {
        const uids = usersKey.map(u=>u.id);
        const us = await prisma.user.findMany({ where: { id: { in: uids } }, select: { email: true } });
        for (const u of us) if (u.email) to.push(u.email);
      }
    }

    const tos = Array.from(new Set(to));
    if (tos.length) {
      await sendMail({ to: tos, subject: `GMUD #${id} — Documento de testes`, html: `<p>Documento de testes disponível para aprovação.</p>`, attachments: attach });
    }

    res.json({ ok: true, next: 5 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status4_error", message: e.message || "Falha no status 4." });
  }
});

// ===== STATUS 5 =====
r.post("/:id/form/5", authRequired, async (req:any, res) => {
  try {
    requireRole(req, ["SOLICITANTE"]);
    const id = Number(req.params.id);
    const body = S5.parse(req.body);

    await ensureTrack(id, 5);
    await prisma.gMUDStatusTrack.updateMany({
      where: { gmudId: id, ordem: 5, tipo: TIPO },
      data: { dados: { observacoes: body.observacoes || "", decisao: body.decisao } }
    });

    await appendLog(id, req.user?.username || "sistema", `Status 5: APROVADO`);
    await prisma.gMUD.update({ where: { id }, data: { status: 6 } });
    await openTrack(id, 6);
    res.json({ ok: true, next: 6 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status5_error", message: e.message || "Falha no status 5." });
  }
});

// Retornar para desenvolvimento (visível só para REQUISITOS)
r.post("/:id/return-dev", authRequired, async (req:any, res) => {
  try {
    requireRole(req, ["REQUISITOS"]);
    const id = Number(req.params.id);
    await appendLog(id, req.user?.username || "sistema", "Retornar para desenvolvimento");
    await prisma.gMUD.update({ where: { id }, data: { status: 3 } });
    await openTrack(id, 3);
    res.json({ ok: true, next: 3 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "return_dev_error", message: e.message || "Falha ao retornar." });
  }
});

// ===== STATUS 6 → 7 =====
r.post("/:id/form/6", authRequired, async (req:any, res) => {
  try {
    requireRole(req, ["REQUISITOS","ANALISTA"]);
    const id = Number(req.params.id);
    const body = S6.parse(req.body);

    await ensureTrack(id, 6);
    await prisma.gMUDStatusTrack.updateMany({
      where: { gmudId: id, ordem: 6, tipo: TIPO },
      data: { dados: { dataGoLive: body.dataGoLive } }
    });

    await appendLog(id, req.user?.username || "sistema", "Status 6 preenchido (Go Live)");
    await prisma.gMUD.update({ where: { id }, data: { status: 7 } });
    await openTrack(id, 7);

    const g = await prisma.gMUD.findUnique({ where: { id }, include: { solicitante: true } });
    const to = [
      g?.solicitante?.email,
      process.env.PROCESSOS_EMAIL || "processos@espro.org.br"
    ].filter(Boolean) as string[];
    if (to.length) await sendMail({ to, subject: `GMUD #${id} — Go Live confirmado (status 7)`, html: `<p>GMUD finalizada.</p>` });

    res.json({ ok: true, next: 7 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status6_error", message: e.message || "Falha no status 6." });
  }
});

// ===== Ações de topo =====
r.post("/:id/pause", authRequired, async (req:any, res) => {
  const id = Number(req.params.id);
  const start = !(await prisma.gMUD.findUnique({ where: { id } }))?.pausada;
  const data = start ? { pausada: true, pausaInicio: new Date(), pausaFim: null } : { pausada: false, pausaFim: new Date() };
  await prisma.gMUD.update({ where: { id }, data });
  await appendLog(id, req.user?.username || "sistema", start ? "Pausou GMUD" : "Retomou GMUD");
  res.json({ ok: true, pausada: start });
});

r.post("/:id/cancel", authRequired, async (req:any, res) => {
  const id = Number(req.params.id);
  const motivo = String(req.body?.motivo || "");
  if (!motivo) return res.status(400).json({ error: "validation_error", message: "Motivo obrigatório." });
  const g = await prisma.gMUD.update({ where: { id }, data: { cancelada: true, cancelMotivo: motivo, cancelAt: new Date() } });
  if (g.solicitacaoId) {
    await prisma.solicitacao.update({ where: { id: g.solicitacaoId }, data: { cancelado: true, cancelMotivo: motivo, cancelAt: new Date() } });
  }
  await appendLog(id, req.user?.username || "sistema", `Cancelou GMUD: ${motivo}`);
  res.json({ ok: true });
});

// observações
r.post("/:id/notes", authRequired, async (req:any, res) => {
  const id = Number(req.params.id);
  const texto = String(req.body?.texto || "");
  if (!texto.trim()) return res.status(400).json({ error: "validation_error", message: "Observação vazia." });
  await appendLog(id, req.user?.username || "sistema", `Obs: ${texto}`);
  res.json({ ok: true });
});

export default r;
