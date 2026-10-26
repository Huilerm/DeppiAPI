import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { verificarPermissao } from "../middleware/rbac.middleware";
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

export default relatorioRouter;
