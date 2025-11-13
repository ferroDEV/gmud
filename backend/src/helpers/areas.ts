import { getPool } from "./sqlserver";

export async function listAreas(): Promise<string[]> {
  const pool = await getPool();
  const rs = await pool.request().query(`
    SELECT DISTINCT RTRIM(LTRIM(u.departamento)) AS area
    FROM Intranet.dbo.usuario u
    WHERE u.departamento IS NOT NULL AND u.departamento <> '' AND u.demissao is null
    ORDER BY area ASC
  `);
  return rs.recordset.map((r: any) => r.area);
}
