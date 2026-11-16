import { Router } from "express";
import { listar, perfil, atualizar, excluir } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { verificarPermissao } from "../middleware/rbac.middleware";

const userRouter = Router();

// GET /users — lista todos os usuários (requer permissão ADMIN)
userRouter.get("/", authMiddleware, verificarPermissao("ADMIN"), listar);

// GET /users/me — perfil do usuário logado
userRouter.get("/me", authMiddleware, perfil);

// PATCH /users/me — atualiza nome, nomeSocial ou senha do usuário logado
userRouter.patch("/atualizar", authMiddleware, atualizar);

// DELETE /users/:id — exclui um usuário (requer permissão ADMIN)
userRouter.delete(
  "/:id",
  authMiddleware,
  verificarPermissao("ADMIN"),
  excluir,
);

export default userRouter;
