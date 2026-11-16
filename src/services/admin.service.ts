
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { PromoverInput } from "../schemas/cadastro.schema";

export async function concederCargo(data: PromoverInput) {
  return prisma.$transaction(async (tx) => {
    // Verifica se o usuário existe
    const usuario = await tx.usuario.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        cargos: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new AppError("Usuário não encontrado", 404);
    }

    // Busca o cargo pelo nome, sem depender de IDs fixos
    const cargo = await tx.cargo.findFirst({
      where: {
        cargo: data.cargo,
      },
    });

    if (!cargo) {
      throw new AppError("Cargo não encontrado", 404);
    }

    // Tratamento específico para PROFESSOR
    if (data.cargo === "PROFESSOR") {
      const professorExistente = await tx.professor.findUnique({
        where: {
          fkUsuario: data.id,
        },
      });

      // Cria o perfil somente se ainda não existir
      if (!professorExistente) {
        if (!data.siape) {
          throw new AppError(
            "Informe o SIAPE para cadastrar o perfil de professor",
            400,
          );
        }

        const siapeExistente = await tx.professor.findUnique({
          where: {
            siape: data.siape,
          },
        });

        if (siapeExistente) {
          throw new AppError("Este SIAPE já está cadastrado", 409);
        }

        await tx.professor.create({
          data: {
            siape: data.siape,
            fkUsuario: data.id,
          },
        });
      }
    }

    // Verifica se o usuário já possui o cargo
    const jaPossuiCargo = usuario.cargos.some(
      (cargoUsuario) => cargoUsuario.id === cargo.id,
    );

    // Associa o cargo ao usuário
if (!jaPossuiCargo || data.cargo === "PROFESSOR") {
  await tx.usuario.update({
    where: {
      id: data.id,
    },
    data: {
      cargos: {
        // Se for professor, remove o cargo ALUNO
        ...(data.cargo === "PROFESSOR"
          ? {
              disconnect: await tx.cargo.findMany({
                where: {
                  cargo: "ALUNO",
                },
                select: {
                  id: true,
                },
              }),
            }
          : {}),

        // Adiciona o novo cargo
        connect: {
          id: cargo.id,
        },
      },
    },
  });
}

    // Retorna os dados atualizados
    const usuarioAtualizado = await tx.usuario.findUnique({
      where: {
        id: data.id,
      },
      select: {
        id: true,
        nome: true,
        emailInstitucional: true,
        cargos: {
          select: {
            cargo: true,
          },
        },
        professor: {
          select: {
            id: true,
            siape: true,
          },
        },
      },
    });

    return usuarioAtualizado;
  });
}
