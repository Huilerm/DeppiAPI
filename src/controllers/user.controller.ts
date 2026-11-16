import { Request, Response, NextFunction } from "express";
import { atualizarUsuarioSchema } from "../schemas/user.schema";
import * as userService from "../services/user.service";

// listar perfis
export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const usuarios = await userService.listarUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
}

// vizualizar perfil
export async function perfil(req: Request, res: Response, next: NextFunction) {
  try {
    const usuarioId = req.user?.userId;
    if (!usuarioId) {
      res.status(401).json({ msg: "Não autorizado" });
      return;
    }

    const usuario = await userService.listarUsuario(usuarioId);
    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
}

// atualizar perfil
export async function atualizar(req: Request, res: Response, next: NextFunction) {
  try{
    const usuarioId = req.user?.userId;
    if (!usuarioId) {
      res.status(401).json({ msg: "Não autorizado" });
      return;
    }

    const parsed = atualizarUsuarioSchema.safeParse(req.body);
    if(!parsed.success){
      res.status(400).json({ msg: "Dados inválidos", erros: parsed.error.issues });
      return;
    }
    
    const usuarioAtualizado = await userService.atualizarUsuario(usuarioId, parsed.data);
    res.status(200).json({ msg: "Perfil atualizado", usuario: usuarioAtualizado });
  } catch (error) {
    next(error);
  }
}

// Excluir usuário
export async function excluir(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await userService.excluirUsuario(req.params.id);

    res.status(200).json({
      msg: "Usuário excluído com sucesso",
    });
  } catch (error) {
    next(error);
  }
}
