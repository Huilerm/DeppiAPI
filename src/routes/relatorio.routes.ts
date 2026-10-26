import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { verificarPermissao } from "../middleware/rbac.middleware";
import { prisma } from "../lib/prisma";
import {
  inscricoesPorSituacao,
  resumoSistema,
  listarCursos,
  exportarCsv
} from "../controllers/relatorio.controller";

const relatorioRouter = Router();

relatorioRouter.use(authMiddleware, verificarPermissao("ADMIN"));

relatorioRouter.get("/inscricoes-por-situacao", inscricoesPorSituacao);
relatorioRouter.get("/resumo", resumoSistema);
relatorioRouter.get("/cursos", listarCursos);
relatorioRouter.get("/cursos/exportar", exportarCsv);

// ---- RESET DE DADOS DE TESTE (remover depois) ----
const MANTER = [
  process.env.SEED_ADMIN_EMAIL || "admin.teste@deppi.edu.br",
  process.env.SEED_DEPPI_EMAIL || "deppi.teste@deppi.edu.br",
  process.env.SEED_PROFESSOR_EMAIL || "professor.teste@deppi.edu.br",
  process.env.SEED_ALUNO_EMAIL || "aluno.teste@deppi.edu.br",
].map((e) => e.trim().toLowerCase());

relatorioRouter.delete("/resetar-teste", async (_req, res, next) => {
  try {
    if (process.env.PERMITIR_RESET !== "true") {
      return res.status(403).json({ mensagem: "Reset desativado neste ambiente." });
    }

    const extras = await prisma.usuario.findMany({
      where: { emailInstitucional: { notIn: MANTER } },
      select: { id: true, fkIdentidade: true },
    });
    const ids = extras.map((u) => u.id);
    const identidades = extras.map((u) => u.fkIdentidade);

    await prisma.$transaction([
      prisma.historico.deleteMany(),
      prisma.documento.deleteMany(),
      prisma.rendaFamiliar.deleteMany(),
      prisma.inscricao.deleteMany(),
      prisma.alocacaoProfessor.deleteMany(),
      prisma.curso.deleteMany(),
      prisma.capa.deleteMany(),
      prisma.instituicao.deleteMany(),
      prisma.aluno.deleteMany({ where: { fkUsuario: { in: ids } } }),
      prisma.professor.deleteMany({ where: { fkUsuario: { in: ids } } }),
      prisma.tituloEleitor.deleteMany({ where: { fkUsuario: { in: ids } } }),
      prisma.usuario.deleteMany({ where: { id: { in: ids } } }),
      prisma.identidade.deleteMany({ where: { id: { in: identidades } } }),
    ]);

    res.status(200).json({ mensagem: "Dados de teste apagados." });
  } catch (error) {
    next(error);
  }
});
// ---- FIM DO RESET ----

export default relatorioRouter;
