import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { atualizarUsuarioInput } from "../schemas/user.schema";

export async function listarUsuarios() {
  return await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      emailInstitucional: true,
      criadoEm: true,
      cargos: { select: { cargo: true } },
    },
  });
}

export async function listarUsuario(id: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: {
      cargos: true,
      alunos: true,
      professor: true,
    },
  });

  if (!usuario) throw new AppError("Usuário não encontrado", 404);
  return usuario;
}

export async function atualizarUsuario(
  id: string,
  data: atualizarUsuarioInput,
) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
  });
  if (!usuario) throw new AppError("Usuário não encontrado", 404);

  let senhaHash = usuario.senha;
  if (data.senha) {
    senhaHash = await bcrypt.hash(data.senha, 10);
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: { id },
    data: {
      nome: data.nome ?? usuario.nome,
      nomeSocial: data.nomeSocial ?? usuario.nomeSocial,
      senha: senhaHash,
    },
    select: { id: true, nome: true, emailInstitucional: true },
  });

  return usuarioAtualizado;
}
