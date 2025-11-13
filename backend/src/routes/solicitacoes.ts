import { Router } from "express";
import { authRequired } from "../auth/middleware";
import { prisma } from "../db/client";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";
import { sendMail } from "../helpers/mail";
import { getPool } from "../helpers/sqlserver";

const r = Router();

// storage uploads
const uploadDir = path.resolve("uploads/solicitacoes");
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

// ===== Schemas =====
const CreateSchema = z.object({
  titulo: z.string().trim().min(1, "titulo vazio"),
  area: z.string().trim().min(1, "area vazia"),
  solicitanteId: z.coerce.number().int().positive("solicitanteId inválido"),
  form: z.any().optional(),
});
const Status1Schema = z.object({
  desenvolvedorIds: z.array(z.number().int()).min(1),
  requisitosId: z.number().int(),
  prioridadeEspro: z.enum(["Baixo","Média","Alta","Urgente"]),
  prioridadeInterna: z.enum(["Baixo","Média","Alta","Urgente"]),
});
const Status2Schema = z.object({
  dataInicialEntrevista: z.string().min(1), // ISO date
  tempoGastoEntrevista: z.string().min(1),  // HH:MM
  // arquivos via upload
});
const Status3Schema = z.object({
  observacoes: z.string().optional(),
  decisao: z.enum(["aprovar","reprovar"]),
});
const Status4Schema = z.object({
  tempoGasto: z.string().min(1),
  dataFimRequisitos: z.string().min(1),
  anexoRequisitos: z.string().optional()
});
const NoteSchema = z.object({ texto: z.string().min(1) });
const AssignSchema = z.object({
  solicitanteId: z.number().int().optional(),
  analistaRequisitosId: z.number().int().nullable().optional(),
  desenvolvedorId: z.number().int().optional(), // guardado no track do status 1
});

// ===== Helpers =====
const TIPO = "SOLICITAÇÃO";

async function openTrack(solicitacaoId: number, ordem: number) {
  // encerra track atual se existir
  const current = await prisma.solicitacaoStatusTrack.findFirst({
    where: { solicitacaoId, tipo: TIPO, dataFim: null },
    orderBy: { id: "desc" }
  });
  if (current) {
    await prisma.solicitacaoStatusTrack.update({
      where: { id: current.id },
      data: { dataFim: new Date() }
    });
  }
  // inicia nova
  return prisma.solicitacaoStatusTrack.create({
    data: { solicitacaoId, ordem, tipo: TIPO, dados: {} }
  });
}

async function ensureTrackStarted(solicitacaoId: number, ordem: number) {
  const exists = await prisma.solicitacaoStatusTrack.findFirst({
    where: { solicitacaoId, tipo: TIPO, ordem }
  });
  if (!exists) await prisma.solicitacaoStatusTrack.create({
    data: { solicitacaoId, ordem, tipo: TIPO, dados: {} }
  });
}

async function appendLog(solicitacaoId: number, user: string, acao: string) {
  await prisma.solicitacaoLog.create({ data: { solicitacaoId, user, acao } });
}

function requireRole(req: any, role: "REQUISITOS" | "PROCESSOS" | "SOLICITANTE") {
  const r = req.user?.role;
  if (r === "ADMIN") return true;
  if (r !== role) throw Object.assign(new Error("Permissão negada."), { status: 403 });
  return true;
}

// ===== Rotas =====

// Listar
r.get("/", authRequired, async (_req, res) => {
  try {
    const rows = await prisma.solicitacao.findMany({
      orderBy: { id: "desc" },
      include: { solicitante: true, analistaRequisitos: true },
    });
    res.json(rows);
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao listar solicitações.", details: { message: e?.message } });
  }
});

// Detalhe
r.get("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const row = await prisma.solicitacao.findUnique({
      where: { id },
      include: {
        solicitante: true,
        analistaRequisitos: true,
        logs: { orderBy: { id: "desc" } },
        tracks: { where: { tipo: TIPO }, orderBy: { ordem: "asc" } },
        arquivos: true,
      },
    });
    if (!row) return res.status(404).json({ error: "not_found", message: "Solicitação não encontrada." });
    res.json(row);
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao carregar solicitação.", details: { message: e?.message } });
  }
});

// Criar (status 1 + e-mail a Processos)
r.post("/", authRequired, async (req: any, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    // retorna detalhes úteis para identificar o campo que está falhando
    return res.status(400).json({
      error: "validation_error",
      message: "Dados inválidos.",
      details: parsed.error.flatten(), // <— mostra os campos problemáticos
      raw: req.body,                   // opcional: remover em produção
    });
  }
  try {
    const row = await prisma.solicitacao.create({
      data: {
        titulo: parsed.data.titulo,
        area: parsed.data.area,
        solicitanteId: parsed.data.solicitanteId,
        analistaRequisitosId: null,
        status: 1,
        dadosStatus: parsed.data.form || {},
      },
    });

    // abre trilha status 1
    await ensureTrackStarted(row.id, 1);

    // e-mail a Processos
    const to = process.env.PROCESSOS_EMAIL || "processos@espro.org.br";
    await sendMail({
      to,
      subject: `Nova Solicitação #${row.id}: ${row.titulo}`,
      html: `<p>Área: <b>${row.area}</b></p><p>Título: <b>${row.titulo}</b></p><p>ID: <b>${row.id}</b></p>`,
    });

    await appendLog(row.id, req.user?.username || "sistema", "Criou solicitação (status 1) e notificou Processos");
    res.json(row);
  } catch (e:any) {
    res.status(500).json({ error: "db_error", message: "Falha ao criar solicitação.", details: { message: e?.message } });
  }
});

// Salvar formulário por status (1..5) + avançar automaticamente (ou retroceder no 3/5)
r.post("/:id/form/1", authRequired, async (req: any, res) => {
  try {
    requireRole(req, "REQUISITOS");
    const id = Number(req.params.id);
    const body = Status1Schema.parse(req.body);

    // grava trilha
    await ensureTrackStarted(id, 1);
    await prisma.solicitacaoStatusTrack.updateMany({
      where: { solicitacaoId: id, ordem: 1, tipo: TIPO },
      data: { dados: body }
    });

    // vincula recursos (muitos DEV + 1 NEGÓCIOS)
    const devs = await prisma.recurso.findMany({ where: { id: { in: body.desenvolvedorIds } } });
    const reqRec = await prisma.recurso.findUnique({ where: { id: body.requisitosId } });

    // limpa vínculos anteriores e recria
    await prisma.solicitacaoRecurso.deleteMany({ where: { solicitacaoId: id } });

    const dataLinks = [
      ...devs.map(d => ({
        solicitacaoId: id,
        recursoId: d.id,
        tipo: "DESENVOLVEDOR",
      })),
      ...(reqRec
        ? [
            {
              solicitacaoId: id,
              recursoId: reqRec.id,
              tipo: "NEGÓCIOS",
            },
          ]
        : []),
    ];

    if (dataLinks.length)
      await prisma.solicitacaoRecurso.createMany({
        data: dataLinks,
      });

    await appendLog(id, req.user?.username || "sistema", "Preencheu Status 1 (múltiplos desenvolvedores)");
    await prisma.solicitacao.update({ where: { id }, data: { status: 2 } });
    await openTrack(id, 2);
    res.json({ ok: true, next: 2 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status1_error", message: e.message || "Falha no status 1." });
  }
});

r.post("/:id/form/2", authRequired, async (req: any, res) => {
  try {
    requireRole(req, "REQUISITOS");
    const id = Number(req.params.id);
    const body = Status2Schema.parse(req.body);

    await prisma.solicitacaoStatusTrack.updateMany({
      where: { solicitacaoId: id, ordem: 2, tipo: TIPO },
      data: { dados: body }
    });

    await appendLog(id, req.user?.username || "sistema", "Preencheu Status 2");
    // avança ao 3
    await prisma.solicitacao.update({ where: { id }, data: { status: 3 } });
    await openTrack(id, 3);
    res.json({ ok: true, next: 3 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status2_error", message: e.message || "Falha no status 2." });
  }
});

// Aprovar/Recusar no status 3 (PROCESSOS)
r.post("/:id/form/3", authRequired, async (req: any, res) => {
  try {
    requireRole(req, "PROCESSOS");
    const id = Number(req.params.id);
    const body = Status3Schema.parse(req.body);

    await prisma.solicitacaoStatusTrack.updateMany({
      where: { solicitacaoId: id, ordem: 3, tipo: TIPO },
      data: { dados: body }
    });

    await appendLog(id, req.user?.username || "sistema", `Status 3: ${body.decisao.toUpperCase()}`);

    if (body.decisao === "reprovar") {
      // volta ao 2
      await prisma.solicitacao.update({ where: { id }, data: { status: 2 } });
      await openTrack(id, 2);
      res.json({ ok: true, next: 2 });
    } else {
      // avança ao 4
      await prisma.solicitacao.update({ where: { id }, data: { status: 4 } });
      await openTrack(id, 4);
      res.json({ ok: true, next: 4 });
    }
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status3_error", message: e.message || "Falha no status 3." });
  }
});

r.post("/:id/form/4", authRequired, async (req: any, res) => {
  try {
    requireRole(req, "REQUISITOS");
    const id = Number(req.params.id);
    const body = Status4Schema.parse(req.body);

    await prisma.solicitacaoStatusTrack.updateMany({
      where: { solicitacaoId: id, ordem: 4, tipo: TIPO },
      data: { dados: body }
    });

    await appendLog(id, req.user?.username || "sistema", "Preencheu Status 4");

    // avança ao 5 e envia e-mail ao solicitante com anexo de requisito (status 4)
    await prisma.solicitacao.update({ where: { id }, data: { status: 5 } });
    await openTrack(id, 5);

    const sol = await prisma.solicitacao.findUnique({
      where: { id },
      include: { solicitante: true, arquivos: true }
    });
    const anex4 = sol?.arquivos?.filter(a => a.statusOrdem === 4) || [];
    const attachments = anex4.length ? [{ filename: anex4[anex4.length-1].filename, path: anex4[anex4.length-1].path }] : [];

    const to = sol?.solicitante?.email;
    if (to) {
      await sendMail({
        to,
        subject: `Solicitação #${id} - Documento de requisitos para aprovação`,
        html: `<p>Olá ${sol?.solicitante?.name || ""},</p><p>Segue documento de requisitos para aprovação.</p>`,
        attachments
      });
    }

    res.json({ ok: true, next: 5 });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status4_error", message: e.message || "Falha no status 4." });
  }
});

// Aprovar/Recusar no status 5 (SOLICITANTE)
r.post("/:id/form/5", authRequired, async (req: any, res) => {
  try {
    requireRole(req, "SOLICITANTE");
    const id = Number(req.params.id);
    const body = z.object({ decisao: z.enum(["aprovar","reprovar"]) }).parse(req.body);

    await prisma.solicitacaoStatusTrack.updateMany({
      where: { solicitacaoId: id, ordem: 5, tipo: TIPO },
      data: { dados: body }
    });
    await appendLog(id, req.user?.username || "sistema", `Status 5: ${body.decisao.toUpperCase()}`);

    if (body.decisao === "reprovar") {
      await prisma.solicitacao.update({ where: { id }, data: { status: 4 } });
      await openTrack(id, 4);
      return res.json({ ok: true, next: 4 });
    }

    // Aprovação: finaliza (6) e cria GMUD (status 1 GMUD)
    // ... dentro de r.post("/:id/form/5")
    await prisma.solicitacao.update({ where: { id }, data: { status: 6 } });
    await openTrack(id, 6);

    // cria GMUD com recursos herdados
    const solFull = await prisma.solicitacao.findUnique({
      where: { id },
      include: { solicitante: true, recursos: { include: { recurso: true } } }
    });

    const g = await prisma.gMUD.create({
      data: {
        titulo: `GMUD de Solicitação #${id}`,
        solicitacaoId: id,
        solicitanteId: solFull!.solicitanteId,
        analistaRequisitosId: solFull!.analistaRequisitosId,
        status: 1,
        dadosStatus: {}
      }
    });

    // herda recursos
    if (solFull?.recursos?.length) {
      await prisma.gMUDRecurso.createMany({
        data: solFull.recursos.map((r:any) => ({ gmudId: g.id, recursoId: r.recursoId })),
        skipDuplicates: true
      });
    }

    // e-mail aos desenvolvedores
    const devs = (solFull?.recursos || []).filter((r:any) => r.recurso?.tipo === "Desenvolvedor");
    if (devs.length) {
      // tenta resolver e-mails pelos Users vinculados (cpf ou nome)
      const recIds = devs.map((r:any)=> r.recursoId);
      const recs   = await prisma.recurso.findMany({ where: { id: { in: recIds } } });
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
        await sendMail({
          to: tos,
          subject: `Nova GMUD #${g.id} — Início (status 1)`,
          html: `<p>GMUD #${g.id} criada a partir da solicitação #${id}.</p>`
        });
      }
    }

    await appendLog(id, req.user?.username || "sistema", "Aprovado pelo solicitante. GMUD criada (status 1).");
    res.json({ ok: true, next: 6, createdGMUD: g.id });
  } catch (e:any) {
    res.status(e.status || 500).json({ error: "status5_error", message: e.message || "Falha no status 5." });
  }
});

// Upload múltiplo (status 2) e único (status 4)
r.post("/:id/upload", authRequired, uploader.array("files", 10), async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const ordem = parseInt(String(req.query.ordem || "0"), 10);
    if (![2,4].includes(ordem)) return res.status(400).json({ error: "invalid_ordem", message: "Apenas status 2 ou 4." });
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) return res.status(400).json({ error: "no_files", message: "Sem arquivos." });

    // se for status 4, mantém apenas o mais recente (anexo único)
    if (ordem === 4) {
      await prisma.solicitacaoArquivo.deleteMany({ where: { solicitacaoId: id, statusOrdem: 4 } });
    }

    const created = await prisma.$transaction(files.map(f => prisma.solicitacaoArquivo.create({
      data: {
        solicitacaoId: id,
        statusOrdem: ordem,
        filename: f.originalname,
        path: f.path,
        mime: f.mimetype,
        size: f.size,
        uploadedBy: req.user?.username || "sistema"
      }
    })));

    await appendLog(id, req.user?.username || "sistema", `Upload status ${ordem}: ${files.length} arquivo(s)`);
    res.json(created);
  } catch (e:any) {
    res.status(500).json({ error: "upload_error", message: e.message || "Falha no upload." });
  }
});

// Alterações rápidas (top box)
r.post("/:id/assign", authRequired, async (req: any, res) => {
  const id = Number(req.params.id);
  try {
    const body = AssignSchema.parse(req.body);
    const data: any = {};
    if (body.solicitanteId !== undefined) data.solicitanteId = body.solicitanteId;
    if (body.analistaRequisitosId !== undefined) data.analistaRequisitosId = body.analistaRequisitosId;

    if (Object.keys(data).length) {
      await prisma.solicitacao.update({ where: { id }, data });
      await appendLog(id, req.user?.username || "sistema", `Alterou: ${Object.keys(data).join(", ")}`);
    }

    if (body.desenvolvedorId !== undefined) {
      // gravar no track 1 (campo desenvolvedor)
      const t1 = await prisma.solicitacaoStatusTrack.findFirst({ where: { solicitacaoId: id, ordem: 1, tipo: TIPO } });
      if (t1) {
        const dados = t1.dados as any;
        dados.desenvolvedorId = body.desenvolvedorId;
        await prisma.solicitacaoStatusTrack.update({ where: { id: t1.id }, data: { dados } });
        await appendLog(id, req.user?.username || "sistema", "Alterou desenvolvedor (status 1)");
      }
    }

    res.json({ ok: true });
  } catch (e:any) {
    res.status(400).json({ error: "assign_error", message: e.message || "Falha no assign." });
  }
});

// Cancelar solicitação
r.post("/:id/cancel", authRequired, async (req: any, res) => {
  const id = Number(req.params.id);
  try {
    const reason = String(req.body?.motivo || "");
    if (!reason) return res.status(400).json({ error: "validation_error", message: "Motivo obrigatório." });
    await prisma.solicitacao.update({ where: { id }, data: { cancelado: true, cancelMotivo: reason, cancelAt: new Date() } });
    await appendLog(id, req.user?.username || "sistema", `Cancelou: ${reason}`);
    res.json({ ok: true });
  } catch (e:any) {
    res.status(500).json({ error: "cancel_error", message: e.message || "Falha ao cancelar." });
  }
});

// Observação livre (acompanhamento)
r.post("/:id/notes", authRequired, async (req: any, res) => {
  const id = Number(req.params.id);
  try {
    const body = NoteSchema.parse(req.body);
    await appendLog(id, req.user?.username || "sistema", `Obs: ${body.texto}`);
    res.json({ ok: true });
  } catch (e:any) {
    res.status(400).json({ error: "note_error", message: e.message || "Falha ao registrar observação." });
  }
});

// Usuários-chave por áreas (lidas do cadastro da solicitação)
r.get("/:id/key-users", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const sol = await prisma.solicitacao.findUnique({ where: { id } });
    const areas = Array.isArray((sol?.dadosStatus as any)?.areasEnvolvidas) ? (sol!.dadosStatus as any).areasEnvolvidas as string[] : [];
    if (!areas.length) return res.json([]);

    const pool = await getPool();
    const items: { id:number; name:string; area:string }[] = [];
    for (const a of areas) {
      const rs = await pool.request().input("a", a).query(`
        SELECT TOP 30 u.Id AS id, u.Nome AS name, u.Area AS area
        FROM dbo.Usuarios u
        WHERE u.Area = @a
        ORDER BY u.Nome ASC
      `);
      for (const r of rs.recordset) items.push({ id: r.id, name: r.name, area: r.area });
    }
    // dedup por id
    const seen = new Set<number>();
    const out = items.filter(u => (seen.has(u.id) ? false : (seen.add(u.id), true)));
    res.json(out);
  } catch (e:any) {
    res.status(500).json({ error: "mssql_error", message: "Falha ao listar usuários-chave.", details: { message: e?.message } });
  }
});

export default r;
