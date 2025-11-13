import { prisma } from "../db/client";

/**
 * Retorna o nome do papel a partir do cargo (title) do AD.
 * Se não houver mapeamento, retorna "SOLICITANTE".
 */
export async function resolveRoleFromCargoName(cargoNome?: string): Promise<string> {
  if (!cargoNome) return "SOLICITANTE";

  // comparação case-insensitive feita manualmente
  const all = await prisma.papelCargo.findMany({
    include: { papel: true },
  });

  const found = all.find(
    (c) => c.cargoNome.trim().toLowerCase() === cargoNome.trim().toLowerCase()
  );

  return found?.papel?.nome || "SOLICITANTE";
}
