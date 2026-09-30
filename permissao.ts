import { prisma } from "./src/lib/prisma";

async function main() {
  const usuarioId = "7afee89e-bcaf-4a53-a462-8047ea5d5130";

  await prisma.usuario.update({
    where: {
      id: usuarioId,
    },
    data: {
      cargos: {
        connect: {
          id: 2,
        },
      },
    },
  });

  console.log("Usuário agora é PROFESSOR.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
