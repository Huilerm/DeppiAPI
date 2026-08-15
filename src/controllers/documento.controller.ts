import { Request, Response, NextFunction } from "express";
import { inscricaoIdParamsSchema } from "../schemas/inscricao.schema";
import {
  documentoIdParamsSchema,
  uploadDocumentoBodySchema,
} from "../schemas/documento.schema";
import {
  enviarDocumento,
  listarDocumentosDaInscricao,
  buscarDocumento,
  removerDocumento,
} from "../services/documento.service";
import { storageService } from "../storage/storageDocuments";

export async function enviar(req: Request, res: Response, next: NextFunction) {
  try {
    const params = inscricaoIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ mensagem: "Dados inválidos", erros: params.error.issues });
      return;
    }

    const body = uploadDocumentoBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ mensagem: "Dados inválidos", erros: body.error.issues });
      return;
    }

    const usuarioId = req.user?.userId;
    if (!usuarioId) {
      res.status(401).json({ mensagem: "Não autorizado" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ mensagem: "Nenhum arquivo enviado." });
      return;
    }

    const documento = await enviarDocumento({
      inscricaoId: params.data.id,
      usuarioId,
      file: req.file,
      categoria: body.data.categoria,
    });

    res.status(201).json({ mensagem: "Documento enviado com sucesso", documento });
  } catch (error) {
    next(error);
  }
}

export async function listarDaInscricao(req: Request, res: Response, next: NextFunction) {
  try {
    const params = inscricaoIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ mensagem: "Dados inválidos", erros: params.error.issues });
      return;
    }

    const usuarioId = req.user?.userId;
    if (!usuarioId) {
      res.status(401).json({ mensagem: "Não autorizado" });
      return;
    }

    const documentos = await listarDocumentosDaInscricao(params.data.id, usuarioId);
    res.status(200).json({ mensagem: "Documentos encontrados", documentos });
  } catch (error) {
    next(error);
  }
}

export async function visualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const params = documentoIdParamsSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({
        mensagem: "Dados inválidos",
        erros: params.error.issues
      });
      return;
    }

    const usuarioId = req.user?.userId;

    if (!usuarioId) {
      res.status(401).json({
        mensagem: "Não autorizado"
      });
      return;
    }

    const documento = await buscarDocumento(
      params.data.id,
      usuarioId
    );

    res.redirect(documento.caminho);

  } catch (error) {
    next(error);
  }
}

export async function remover(req: Request, res: Response, next: NextFunction) {
  try {
    const params = documentoIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ mensagem: "Dados inválidos", erros: params.error.issues });
      return;
    }

    const usuarioId = req.user?.userId;
    if (!usuarioId) {
      res.status(401).json({ mensagem: "Não autorizado" });
      return;
    }

    await removerDocumento(params.data.id, usuarioId);
    res.status(200).json({ mensagem: "Documento removido com sucesso" });
  } catch (error) {
    next(error);
  }
}