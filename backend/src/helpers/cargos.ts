import { getPool } from "./sqlserver";

export type Cargo = { id: string; nome: string };

export async function listCargos(q?: string): Promise<Cargo[]> {
  const pool = await getPool();
  if (q && q.trim()) {
    const req = pool.request();
    req.input("q", `%${q}%`);
    const rs = await req.query(`
      SELECT DISTINCT
        cod_cargo AS id,
        c.cargo AS nome,
        c.departamento AS area
      FROM Intranet.dbo.usuario c
      WHERE c.cargo LIKE UPPER(@q) and demissao is null
      ORDER BY c.cargo ASC
    `);
    return rs.recordset as Cargo[];
  }
  const rs = await pool.request().query(`
    SELECT DISTINCT
        cod_cargo AS id,
        c.cargo AS nome,
        c.departamento AS area
    FROM Intranet.dbo.usuario c
    WHERE demissao is null
    ORDER BY c.cargo ASC
  `);
  return rs.recordset as Cargo[];
}
