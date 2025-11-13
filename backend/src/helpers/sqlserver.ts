import sql from "mssql";

const cfg: sql.config = {
  server: process.env.MSSQL_HOST || "127.0.0.1",
  port: parseInt(process.env.MSSQL_PORT || "1433", 10),
  user: process.env.MSSQL_USER || "",
  password: process.env.MSSQL_PASSWORD || "",
  database: process.env.MSSQL_DATABASE || "",
  options: {
    encrypt: (process.env.MSSQL_ENCRYPT || "false") === "true",
    trustServerCertificate: (process.env.MSSQL_TRUST_SERVER_CERTIFICATE || "true") === "true",
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (pool && pool.connected) return pool;
  pool = await new sql.ConnectionPool(cfg).connect();
  return pool;
}
