import "dotenv/config";
import { prisma } from "./client";
import argon2 from "argon2";

async function main() {
  const adminPass = "Admin!234";
  const hash = await argon2.hash(adminPass);
  await prisma.user.upsert({
    where: { username: "admin@local" },
    update: {},
    create: { username: "admin@local", name: "Administrador", role: "ADMIN", isLocal: true, passwordHash: hash },
  });

  const roles = ["SOLICITANTE","REQUISITOS","PROCESSOS","ANALISTA","ADMIN"];
  for (const nome of roles) {
    await prisma.papel.upsert({ where: { nome }, update: {}, create: { nome } });
  }

  const recursos = [
    { nome: "Dev Alice", tipo: "DEV" },
    { nome: "Dev Bob", tipo: "DEV" },
    { nome: "Req Carol", tipo: "REQUISITOS" },
    { nome: "Req Diego", tipo: "REQUISITOS" },
  ];
  for (const r of recursos) await prisma.recurso.create({ data: r });

  const status = [
    "Análise de investimentos","Fila de Desenvolvimento","Desenvolvimento",
    "Homologação Interna","Homologação Solicitante","Go Live","Finalizado",
  ];
  for (let i=0;i<status.length;i++) {
    await prisma.statusCatalog.create({ data: { nome: status[i], ordem: i+1 } });
  }

  console.log("Seed concluído.");
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1); });
