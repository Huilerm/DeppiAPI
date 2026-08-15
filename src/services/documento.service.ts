import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { storageService } from "../storage/storageDocuments";
import { TIPOS_PERMITIDOS } from "../middleware/upload.middleware";
import { RbacService } from "./rbac.service";
import type { CategoriaDocumento } from "../../generated/prisma/client";

const rbacService = new RbacService();
const PERMISSAO_GERENCIAR_INSCRICAO = "GERENCIAR_INSCRICAO";

interface EnviarDocumentoParams {
  inscricaoId: string;
  usuarioId: string;
  file: Express.Multer.File;
  categoria?: CategoriaDocumento | undefined; 
}

async function verificarPropriedadeOuPermissao(
  inscricaoId: string,
  usuarioId: string,
) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    include: { aluno: true },
  });

  if (!inscricao) throw new AppError("Inscrição não encontrada", 404);

  const aluno = await prisma.aluno.findFirst({ where: { fkUsuario: usuarioId } });
  const ehDono = aluno?.id === inscricao.fkAluno;

  if (ehDono) return inscricao;

  const permissoesUsuario = await rbacService.obterPermissoes(usuarioId);
  const podeGerenciar = permissoesUsuario.includes(PERMISSAO_GERENCIAR_INSCRICAO);

  if (!podeGerenciar) {
    throw new AppError("Sem permissão para acessar documentos dessa inscrição", 403);
  }

  return inscricao;
}

export async function enviarDocumento({
  inscricaoId,
  usuarioId,
  file,
  categoria,
}: EnviarDocumentoParams) {
  await verificarPropriedadeOuPermissao(inscricaoId, usuarioId);

  if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
    throw new AppError("Tipo de arquivo não permitido.", 400);
  }

  const subpasta = `inscricoes/${inscricaoId}`;
  const { nomeArquivo, caminho } = await storageService.salvar(
    file.buffer,
    file.originalname,
    subpasta,
    storageService.getBucketDocumentos(),
    file.mimetype
  );

  return prisma.documento.create({
    data: {
      nomeOriginal: file.originalname,
      nomeArquivo,
      caminho,
      tipoMime: file.mimetype,
      tamanho: file.size,
      categoria: categoria ?? "OUTRO",
      fkInscricao: inscricaoId,
    },
  });
}

export async function listarDocumentosDaInscricao(
  inscricaoId: string,
  usuarioId: string,
) {
  await verificarPropriedadeOuPermissao(inscricaoId, usuarioId);

  return prisma.documento.findMany({
    where: { fkInscricao: inscricaoId },
    orderBy: { criadoEm: "desc" },
  });
}

export async function buscarDocumento(documentoId: string, usuarioId: string) {
  const documento = await prisma.documento.findUnique({ where: { id: documentoId } });
  if (!documento) throw new AppError("Documento não encontrado", 404);

  await verificarPropriedadeOuPermissao(documento.fkInscricao, usuarioId);
  return documento;
}

export async function removerDocumento(documentoId: string, usuarioId: string) {
  const documento = await buscarDocumento(documentoId, usuarioId);
  await storageService.remover(documento.caminho);
  await prisma.documento.delete({ where: { id: documentoId } });
}