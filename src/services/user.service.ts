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


export async function excluirUsuario(id: string) {
  return prisma.$transaction(async (tx) => {
    // Busca o usuário e suas relações
    const usuario = await tx.usuario.findUnique({
      where: { id },
      include: {
        alunos: {
          include: {
            inscricaos: {
              select: {
                id: true,
              },
            },
          },
        },
        professor: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new AppError("Usuário não encontrado", 404);
    }

    // Impede excluir o último administrador
    const ehAdmin = await tx.usuario.findFirst({
      where: {
        id,
        cargos: {
          some: {
            cargo: "ADMIN",
          },
        },
      },
      select: { id: true },
    });

    if (ehAdmin) {
      const quantidadeAdmins = await tx.usuario.count({
        where: {
          cargos: {
            some: {
              cargo: "ADMIN",
            },
          },
        },
      });

      if (quantidadeAdmins <= 1) {
        throw new AppError(
          "Não é possível excluir o último administrador do sistema",
          400,
        );
      }
    }

    // Remove históricos em que o usuário realizou alterações
    await tx.historico.deleteMany({
      where: {
        fkUsuarioResponsavel: id,
      },
    });

    // Remove dados relacionados ao perfil de aluno
    if (usuario.alunos) {
      const alunoId = usuario.alunos.id;

      const inscricaoIds = usuario.alunos.inscricaos.map(
        (inscricao) => inscricao.id,
      );

      // Remove históricos relacionados ao aluno
      await tx.historico.deleteMany({
        where: {
          fkAluno: alunoId,
        },
      });

      // Remove históricos das inscrições
      if (inscricaoIds.length > 0) {
        await tx.historico.deleteMany({
          where: {
            fkInscricao: {
              in: inscricaoIds,
            },
          },
        });

        // Remove documentos das inscrições
        await tx.documento.deleteMany({
          where: {
            fkInscricao: {
              in: inscricaoIds,
            },
          },
        });

        // Remove rendas familiares
        await tx.rendaFamiliar.deleteMany({
          where: {
            fkInscricao: {
              in: inscricaoIds,
            },
          },
        });

        // Remove inscrições
        await tx.inscricao.deleteMany({
          where: {
            id: {
              in: inscricaoIds,
            },
          },
        });
      }

      // Remove perfil de aluno
      await tx.aluno.delete({
        where: {
          id: alunoId,
        },
      });
    }

    // Remove alocações e perfil de professor
    if (usuario.professor) {
      await tx.alocacaoProfessor.deleteMany({
        where: {
          fkProfessor: usuario.professor.id,
        },
      });

      await tx.professor.delete({
        where: {
          id: usuario.professor.id,
        },
      });
    }

    // Remove título de eleitor
    await tx.tituloEleitor.deleteMany({
      where: {
        fkUsuario: id,
      },
    });

    const identidadeId = usuario.fkIdentidade;

    // Exclui o usuário e seus vínculos com cargos
    await tx.usuario.delete({
      where: {
        id,
      },
    });

    // Remove a identidade vinculada ao usuário
    await tx.identidade.delete({
      where: {
        id: identidadeId,
      },
    });

    return {
      mensagem: "Usuário excluído com sucesso",
    };
  });
}

