
import { Request, Response, NextFunction } from "express";
import { promoverSchema } from "../schemas/cadastro.schema";
import { concederCargo } from "../services/admin.service";

export async function createAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = promoverSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        msg: "Dados inválidos",
        erros: parsed.error.issues,
      });
      return;
    }

    const usuario = await concederCargo(parsed.data);

    res.status(201).json({
      msg: `Cargo ${parsed.data.cargo} concedido com sucesso`,
      usuario: {
        id: usuario?.id,
        nome: usuario?.nome,
        email: usuario?.emailInstitucional,
        cargos: usuario?.cargos,
        professor: usuario?.professor,
      },
    });
  } catch (error) {
    next(error);
  }
}
