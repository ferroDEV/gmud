import { Prisma } from "@prisma/client";

export function toHttpError(err: any) {
  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const code = err.code;
    if (code === "P2002") return { status: 409, error: "unique_violation", message: "Registro duplicado.", details: { target: err.meta?.target } };
    if (code === "P2025") return { status: 404, error: "not_found", message: "Registro não encontrado." };
    return { status: 400, error: "db_error", message: err.message, details: { code } };
  }
  // LDAP
  if (err && err.name && String(err.name).toLowerCase().includes("ldap")) {
    return { status: 401, error: "ad_auth_error", message: err.message || "Falha na autenticação AD.", details: { ...err } };
  }
  // Genérico
  return { status: 500, error: "internal_error", message: err?.message || "Erro interno." };
}
