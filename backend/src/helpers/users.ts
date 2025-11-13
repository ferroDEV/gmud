import { prisma } from "../db/client";
import { getPool } from "./sqlserver";

export type UserOpt = { id: number; name: string; area: string };

// backend/src/helpers/users.ts
export async function searchUsers(q: string): Promise<UserOpt[]> {
  const pool = await getPool();

  // busca primeiro no SQL Server pelo nome
  const req = pool.request();
  req.input("q", `%${q}%`);
  const rs = await req.query(`
    SELECT
      u.cpf AS cpf,
      u.nome AS name,
      u.departamento AS area
    FROM Intranet.dbo.usuario u
    WHERE u.nome LIKE UPPER(@q) AND u.demissao IS NULL
    ORDER BY u.nome ASC
  `);

  const colabs = rs.recordset as { cpf: string; name: string; area: string }[];

  // agora busca na tabela users (MySQL)
  const usersDb = await prisma.user.findMany({
    where: { cpf: { in: colabs.map((c) => c.cpf) } },
    select: { id: true, cpf: true },
  });

  // mapeia cpf -> id real
  const idMap = new Map(usersDb.map((u) => [u.cpf, u.id]));

  return colabs.map((c) => ({
    id: idMap.get(c.cpf) ?? Number(c.cpf.replace(/\D+/g, "")),
    name: c.name,
    area: c.area,
  }));
}

// NOVO: lista usuários (opcionalmente filtrando por área)
export async function listUsers(area?: string): Promise<UserOpt[]> {
  const pool = await getPool();
  if (area) {
    const req = pool.request();
    req.input("a", area);
    const rs = await req.query(`
      SELECT u.cpf AS id, u.nome AS name, u.departamento AS area
      FROM Intranet.dbo.usuario u
      WHERE u.departamento = @a
      ORDER BY u.nome ASC
    `);
    return rs.recordset as UserOpt[];
  } else {
    const rs = await pool.request().query(`
      SELECT u.cpf AS id, u.nome AS name, u.departamento AS area
      FROM Intranet.dbo.usuario u
      ORDER BY u.nome ASC
    `);
    return rs.recordset as UserOpt[];
  }
}

export type ColabInfo = { id?: number; name?: string; area?: string; email?: string; cpf?: string };

/** Busca colaborador por email no SQL Server e retorna CPF e metadados.
 *  Ajuste a query para sua tabela/colunas reais. */
export async function getColaboradorByEmail(email: string): Promise<ColabInfo | null> {
  if (!email) return null;
  const pool = await getPool();
  const req = pool.request();
  req.input("mail", email);
  const rs = await req.query(`
    SELECT TOP 1
      u.id                AS id,
      u.nome              AS name,
      u.departamento      AS area,
      u.email             AS email,
      u.cargo             AS cargo,
      u.cpf               AS cpf
    FROM Intranet.dbo.usuario u
    WHERE u.email = @mail
    ORDER BY u.nome ASC
  `);
  if (!rs.recordset?.length) return null;
  const row = rs.recordset[0];
  return {
    id: row.id ?? undefined,
    name: row.name?.trim?.() ?? undefined,
    area: row.area?.trim?.() ?? undefined,
    email: row.email?.trim?.() ?? undefined,
    cpf: row.cpf?.toString?.().replace(/\D+/g, "") || undefined,
  };
}
