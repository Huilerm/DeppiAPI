import { prisma } from "../src/lib/prisma";

async function main() {
  const permissoes = [
    { permissao: "VER", desc: "Permite acessar o sistema (Login)" },
    {
      permissao: "GERENCIAR_PERFIL",
      desc: "Permite visualizar e editar o próprio perfil",
    },

    // --- ALUNO ---
    {
      permissao: "FAZER_INSCRICAO",
      desc: "Permite realizar inscrições em cursos abertos",
    },
    {
      permissao: "ACOMPANHAR_INSCRICAO",
      desc: "Permite verificar os dados em curso inscrito",
    },

    // --- PROFESSOR ---
    { permissao: "CRIAR_CURSO", desc: "Permite criar novos cursos" },
    {
      permissao: "ACOMPANHAR_CURSO",
      desc: "Permite acompanhar o andamento e visualizar os alunos inscritos nos próprios cursos",
    },

    // --- DEPPI ---
    {
      permissao: "CRIAR_PROFESSOR",
      desc: "Permite criar conta de Professores",
    },
    {
      permissao: "GERENCIAR_PROFESSOR",
      desc: "Permite gerenciar (editar/excluir/listar) contas de professores",
    },
    {
      permissao: "GERENCIAR_CURSO",
      desc: "Permite gerenciar (aprovar/editar/excluir) todos os cursos do sistema",
    },
    {
      permissao: "GERENCIAR_INSCRICAO",
      desc: "Permite gerenciar todas as inscrições realizadas no sistema",
    },
    {
      permissao: "GERENCIAR_PERMISSAO",
      desc: "Permite gerenciar os níveis de acesso e permissões dos usuários",
    },

    // --- ADMIN ---
    {
      permissao: "GERENCIAR_INSTITUICAO",
      desc: "Permite cadastrar e gerenciar instituições",
    },
    {
      permissao: "GERENCIAR_DEPPI",
      desc: "Permite criar e gerenciar contas da equipe do DEPPI",
    },
    {
      permissao: "CRIAR_ALUNO",
      desc: "Permite criar conta de Usuários manualmente",
    },
    {
      permissao: "GERENCIAR_ALUNO",
      desc: "Permite gerenciar (editar/excluir/listar) todas as contas de Usuários",
    },
    {
      permissao: "GERAR_RELATORIO",
      desc: "Permite gerar relatórios gerais do sistema",
    },
    {
      permissao: "VER_DASHBOARD",
      desc: "Permite visualizar dados gerais e estatísticas no Dashboard",
    },
    { permissao: "ADMIN", desc: "Acesso total e irrestrito ao sistema" },
  ];

  const cargos = [
    {
      id: 1,
      cargo: "ALUNO",
      desc: "DISCENTE",
      permissoes: [
        "VER",
        "GERENCIAR_PERFIL",
        "FAZER_INSCRICAO",
        "ACOMPANHAR_INSCRICAO",
      ],
    },
    {
      id: 2,
      cargo: "PROFESSOR",
      desc: "DOCENTE",
      permissoes: [
        "VER",
        "GERENCIAR_PERFIL",
        "CRIAR_CURSO",
        "ACOMPANHAR_CURSO",
      ],
    },
    {
      id: 3,
      cargo: "DEPPI",
      desc: "MEMBRO DO DEPARTAMENTO",
      permissoes: [
        "VER",
        "GERENCIAR_PERFIL",
        "CRIAR_PROFESSOR",
        "GERENCIAR_PROFESSOR",
        "GERENCIAR_CURSO",
        "GERENCIAR_INSCRICAO",
        "GERENCIAR_PERMISSAO",
      ],
    },
    {
      id: 4,
      cargo: "ADMIN",
      desc: "ADMINISTRADOR DO SISTEMA",
      permissoes: [
        "GERENCIAR_INSTITUICAO",
        "GERENCIAR_DEPPI",
        "CRIAR_ALUNO",
        "GERENCIAR_ALUNO",
        "GERAR_RELATÓRIO",
        "VER_DASHBOARD",
        "ADMIN",
      ],
    },
  ];

  for (const p of permissoes) {
    const verificaPermissao = await prisma.permissoes.findFirst({
      where: { permissao: p.permissao },
    });
    if (!verificaPermissao) {
      await prisma.permissoes.create({ data: p });
    }
  }

  const idPermissoes = await prisma.permissoes.findMany();
  for (const c of cargos) {
    const permDeCargo = idPermissoes
  .filter((p: { id: number; permissao: string }) =>
    c.permissoes.includes(p.permissao)
  )
  .map((p: { id: number }) => ({ id: p.id }));
    await prisma.cargo.create({
      data: {
        id: c.id,
        cargo: c.cargo as any,
        desc: c.desc,
        permissoes: {
          connect: permDeCargo,
        },
      },
    });
  }
}

const endereco = await prisma.endereco.create({
  data: {
    rua: "Rua Teste",
    bairro: "Centro",
    numero: 123,
    cep: 60000000,
  },
});

main();
