import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { asyncHandler } from "./utils/async";
import { toHttpError } from "./utils/errors";
import authRouter from "./routes/auth";
import metaRouter from "./routes/meta";
import recursosRouter from "./routes/recursos";
import papeisRouter from "./routes/papeis";
import statusRouter from "./routes/status";
import solicitacoesRouter from "./routes/solicitacoes";
import gmudsRouter from "./routes/gmuds";
import usersRouter from "./routes/users"; // <-- adicionar
import areasRouter from "./routes/areas"; // <-- novo
import cargosRouter from "./routes/cargos";
import path from "path"; // <-- adicionar

const app = express();
app.use(express.json({ limit: "10mb" })); // <— obrigatório
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

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
app.use("/api/users", usersRouter); // <-- adicionar
app.use("/api/areas", areasRouter); // <-- adicionar
app.use("/api/cargos", cargosRouter);

app.use("/uploads", (req, res, next) => { // serve arquivos
  return express.static(path.resolve("uploads"))(req, res, next);
});

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const mapped = toHttpError(err);
  if (process.env.NODE_ENV !== "test") {
    console.error("[ERR]", mapped, err?.stack || err);
  }
  res.status(mapped.status).json({
    error: mapped.error,
    message: mapped.message,
    code: mapped.error,
    details: mapped.details || null,
  });
});

process.on("unhandledRejection", (e)=>console.error("UNHANDLED_REJECTION", e));
process.on("uncaughtException", (e)=>console.error("UNCAUGHT_EXCEPTION", e));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
