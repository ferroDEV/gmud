import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./db/client";
import authRouter from "./routes/auth";
import metaRouter from "./routes/meta";
import recursosRouter from "./routes/recursos";
import papeisRouter from "./routes/papeis";
import statusRouter from "./routes/status";
import solicitacoesRouter from "./routes/solicitacoes";
import gmudsRouter from "./routes/gmuds";

const app = express();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // cookies SameSite=None; Secure atrás de proxy/ingress
}
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/meta", metaRouter);
app.use("/api/recursos", recursosRouter);
app.use("/api/papeis", papeisRouter);
app.use("/api/status", statusRouter);
app.use("/api/solicitacoes", solicitacoesRouter);
app.use("/api/gmuds", gmudsRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
