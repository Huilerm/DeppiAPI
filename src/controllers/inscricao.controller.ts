import { Request, Response, NextFunction } from "express";
import {
  inscricaoIdParamsSchema,
  listarInscricoesQuerySchema,
  motivoSchema,
  rendaFamiliarSchema,
} from "../schemas/inscricao.schema";
import {
  criarInscricao,
  aprovarInscricao,
  buscarInscricao,
  cancelarInscricao,
  listarHistorico,
  listarInscricoes,
  rejeitarInscricao,
  adicionarRendaFamiliar,
  listarMinhasInscricoes
} from "../services/inscricao.service";


export async function minhas(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const usuarioId = req.user?.userId;

    if (!usuarioId) {
      res.status(401).json({
        mensagem: "Não autorizado",
      });
      return;
    }

    const inscricoes = await listarMinhasInscricoes(usuarioId);

    res.status(200).json({
      mensagem: "Minhas inscrições encontradas",
      inscricoes,
    });
  } catch (error) {
    next(error);
  }
}

export async function criar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const usuarioId = req.user?.userId;

    if (!usuarioId) {
      res.status(401).json({
        mensagem: "Não autorizado"
      });
      return;
    }

    const { cursoId } = req.body;

    const inscricao = await criarInscricao(
      usuarioId,
      cursoId
    );

    res.status(201).json(inscricao);
  } catch (error) {
    next(error);
  }
}

export async function adicionarRenda(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const params = inscricaoIdParamsSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({
        mensagem: "Dados inválidos",
        erros: params.error.issues,
      });
      return;
    }

    const body = rendaFamiliarSchema.safeParse(req.body);

    if (!body.success) {
      res.status(400).json({
        mensagem: "Dados inválidos",
        erros: body.error.issues,
      });
      return;
    }

    const usuarioId = req.user?.userId;
    if (!usuarioId) {
      res.status(401).json({ mensagem: "Não autorizado" });
      return;
    }

    const renda = await adicionarRendaFamiliar(
      params.data.id,
      usuarioId,
      body.data
    );

    res.status(200).json({
      mensagem: "Renda familiar registrada com sucesso",
      renda,
    });
  } catch (error) {
    next(error);
  }
}

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listarInscricoesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        mensagem: "Dados inválidos",
        erros: parsed.error.issues,
      });
      return;
    }

    const inscricoes = await listarInscricoes(parsed.data.status);
    res.status(200).json({ mensagem: "Inscrições encontradas", inscricoes });
  } catch (error) {
    next(error);
  }
}

export async function detalhar(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = inscricaoIdParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        mensagem: "Dados inválidos",
        erros: parsed.error.issues,
      });
      return;
    }

    const inscricao = await buscarInscricao(parsed.data.id);
    res.status(200).json({ mensagem: "Inscrição encontrada", inscricao });
  } catch (error) {
    next(error);
  }
}

export async function historico(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = inscricaoIdParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        mensagem: "Dados inválidos",
        erros: parsed.error.issues,
      });
      return;
    }

    const historicoInscricao = await listarHistorico(parsed.data.id);
    res.status(200).json({
      mensagem: "Histórico encontrado",
      historico: historicoInscricao,
    });
  } catch (error) {
    next(error);
  }
}

export async function aprovar(req: Request, res: Response, next: NextFunction) {
  try {
    const params = inscricaoIdParamsSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({
        mensagem: "Dados inválidos",
        erros: params.error.issues,
      });
      return;
    }

    const usuarioId = req.user?.userId;
    if (!usuarioId) {
      res.status(401).json({ mensagem: "Não autorizado" });
      return;
    }

    const inscricao = await aprovarInscricao(params.data.id, usuarioId);

    res.status(200).json({
      mensagem: "Inscrição aprovada com sucesso",
      inscricao,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejeitar(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const params = inscricaoIdParamsSchema.safeParse(req.params);
    const body = motivoSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        mensagem: "Dados inválidos",
        erros: [...(params.success ? [] : params.error.issues), ...(body.success ? [] : body.error.issues)],
      });
      return;
    }

    const usuarioId = req.user?.userId;
    if (!usuarioId) {
      res.status(401).json({ mensagem: "Não autorizado" });
      return;
    }

    const inscricao = await rejeitarInscricao(
      params.data.id,
      usuarioId,
      body.data.motivo,
    );

    res.status(200).json({
      mensagem: "Inscriçãoae rejeitada com sucesso",
      inscricao,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelar(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const params = inscricaoIdParamsSchema.safeParse(req.params);
    const body = motivoSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        mensagem: "Dados inválidos",
        erros: [...(params.success ? [] : params.error.issues), ...(body.success ? [] : body.error.issues)],
      });
      return;
    }

    const usuarioId = req.user?.userId;
    if (!usuarioId) {
      res.status(401).json({ mensagem: "Não autorizado" });
      return;
    }

    const inscricao = await cancelarInscricao(
      params.data.id,
      usuarioId,
      body.data.motivo,
    );

    res.status(200).json({
      mensagem: "Inscrição cancelada com sucesso",
      inscricao,
    });
  } catch (error) {
    next(error);
  }
}
