import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { AppError } from "./errors/AppError.js";
import inscricaoRouter from "./routes/inscricao.routes.js";
import { professorRoutes } from "./routes/professor.routes.js";
import relatorioRouter from "./routes/relatorio.routes.js";
import { courseRoutes } from "./routes/course.routes.js";
import instituicaoRoutes from "./routes/instituicao.routes.js";
import documentoRouter from "./routes/documento.routes.js";

const PORT = process.env.PORT ?? 3000;
const app = express();
app.use(express.json());

// ── Rotas ────────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/admin", adminRouter);
app.use("/inscricoes", inscricaoRouter);
app.use("/cursos", courseRoutes);
app.use("/instituicao", instituicaoRoutes);
app.use(professorRoutes);
app.use("/documentos", documentoRouter);
app.use("/admin/relatorios", relatorioRouter);
// ── Rotas ────────────────────────────────────────────────────────

// ── Verificar servidor ──────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    mensagem: "API funcionando!"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok"
  });
});
// ── Verificar servidor ──────────────────────────────────

// ── Verifica se houve erro ─────────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      mensagem: err.message
    });
  }

  console.error("Erro inesperado:", err);

  if (err instanceof Error) {
    return res.status(500).json({
      mensagem: err.message,
      stack: err.stack
    });
  }

  return res.status(500).json({
    mensagem: "Erro desconhecido",
    erro: err
  });
});
// ── Verifica se houve erro ─────────────────────────────────────────────────

// ── Retorna porta do servidor ─────────────────────
app.listen(PORT, () => {
  console.log(`Server Up: http://localhost:${PORT}`);
});
// ── Retorna porta do servidor ─────────────────────

export default app;
