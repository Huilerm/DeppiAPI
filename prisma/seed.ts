import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/prisma";

const TEST_PASSWORD = process.env.SEED_TEST_PASSWORD || "12345678";
const BUCKET_DOCS = process.env.SUPABASE_BUCKET_DOCS || "deppi-docs";
const BUCKET_IMAGEM = process.env.SUPABASE_BUCKET_IMAGEM || "deppi-imagem";

const IDS = {
  identidadeAdmin: "11111111-1111-4111-8111-111111111111",
  identidadeDeppi: "22222222-2222-4222-8222-222222222222",
  identidadeProfessor: "33333333-3333-4333-8333-333333333333",
  identidadeAluno: "44444444-4444-4444-8444-444444444444",
  usuarioAdmin: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  usuarioDeppi: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  usuarioProfessor: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  usuarioAluno: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  tituloAdmin: "51111111-1111-4111-8111-111111111111",
  tituloDeppi: "52222222-2222-4222-8222-222222222222",
  tituloProfessor: "53333333-3333-4333-8333-333333333333",
  tituloAluno: "54444444-4444-4444-8444-444444444444",
  aluno: "61111111-1111-4111-8111-111111111111",
  professor: "62222222-2222-4222-8222-222222222222",
  instituicao: "71111111-1111-4111-8111-111111111111",
  curso: "72222222-2222-4222-8222-222222222222",
  inscricao: "73333333-3333-4333-8333-333333333333",
  alocacao: "74444444-4444-4444-8444-444444444444",
};

const permissoes = [
  { permissao: "VER", desc: "Permite acessar o sistema (Login)" },
  { permissao: "GERENCIAR_PERFIL", desc: "Permite visualizar e editar o próprio perfil" },
  { permissao: "FAZER_INSCRICAO", desc: "Permite realizar inscrições em cursos abertos" },
  { permissao: "ACOMPANHAR_INSCRICAO", desc: "Permite verificar os dados em curso inscrito" },
  { permissao: "CRIAR_CURSO", desc: "Permite criar novos cursos" },
  { permissao: "ACOMPANHAR_CURSO", desc: "Permite acompanhar o andamento e visualizar os alunos inscritos nos próprios cursos" },
  { permissao: "CRIAR_PROFESSOR", desc: "Permite criar conta de Professores" },
  { permissao: "GERENCIAR_PROFESSOR", desc: "Permite gerenciar contas de professores" },
  { permissao: "GERENCIAR_CURSO", desc: "Permite gerenciar todos os cursos do sistema" },
  { permissao: "GERENCIAR_INSCRICAO", desc: "Permite gerenciar todas as inscrições" },
  { permissao: "GERENCIAR_PERMISSAO", desc: "Permite gerenciar níveis de acesso" },
  { permissao: "GERENCIAR_INSTITUICAO", desc: "Permite cadastrar e gerenciar instituições" },
  { permissao: "GERENCIAR_DEPPI", desc: "Permite criar e gerenciar contas do DEPPI" },
  { permissao: "CRIAR_ALUNO", desc: "Permite criar contas de alunos" },
  { permissao: "GERENCIAR_ALUNO", desc: "Permite gerenciar contas de alunos" },
  { permissao: "GERAR_RELATORIO", desc: "Permite gerar relatórios gerais" },
  { permissao: "VER_DASHBOARD", desc: "Permite visualizar o dashboard" },
  { permissao: "ADMIN", desc: "Acesso total e irrestrito ao sistema" },
];

const cargos = [
  { id: 1, cargo: "ALUNO", desc: "DISCENTE", permissoes: ["VER", "GERENCIAR_PERFIL", "FAZER_INSCRICAO", "ACOMPANHAR_INSCRICAO"] },
  { id: 2, cargo: "PROFESSOR", desc: "DOCENTE", permissoes: ["VER", "GERENCIAR_PERFIL", "CRIAR_CURSO", "ACOMPANHAR_CURSO"] },
  { id: 3, cargo: "DEPPI", desc: "MEMBRO DO DEPARTAMENTO", permissoes: ["VER", "GERENCIAR_PERFIL", "CRIAR_PROFESSOR", "GERENCIAR_PROFESSOR", "GERENCIAR_CURSO", "GERENCIAR_INSCRICAO", "GERENCIAR_PERMISSAO"] },
  { id: 4, cargo: "ADMIN", desc: "ADMINISTRADOR DO SISTEMA", permissoes: ["VER", "GERENCIAR_PERFIL", "GERENCIAR_INSTITUICAO", "GERENCIAR_DEPPI", "CRIAR_ALUNO", "GERENCIAR_ALUNO", "GERAR_RELATORIO", "VER_DASHBOARD", "ADMIN"] },
];

async function garantirPermissoesECargos() {
  const mapaPermissoes = new Map<string, number>();

  for (const permissao of permissoes) {
    const existente = await prisma.permissoes.findFirst({
      where: { permissao: permissao.permissao },
    });

    const registro = existente
      ? await prisma.permissoes.update({
          where: { id: existente.id },
          data: { desc: permissao.desc },
        })
      : await prisma.permissoes.create({ data: permissao });

    mapaPermissoes.set(registro.permissao, registro.id);
  }

  for (const cargo of cargos) {
    const idsPermissoes = cargo.permissoes
      .map((nome) => mapaPermissoes.get(nome))
      .filter((id): id is number => id !== undefined)
      .map((id) => ({ id }));

    await prisma.cargo.upsert({
      where: { id: cargo.id },
      update: {
        cargo: cargo.cargo as any,
        desc: cargo.desc,
        permissoes: { set: idsPermissoes },
      },
      create: {
        id: cargo.id,
        cargo: cargo.cargo as any,
        desc: cargo.desc,
        permissoes: { connect: idsPermissoes },
      },
    });
  }
}

async function garantirEndereco() {
  const existente = await prisma.endereco.findFirst({
    where: { rua: "Rua Teste", numero: 123 },
  });

  if (existente) return existente;

  return prisma.endereco.create({
    data: {
      rua: "Rua Teste",
      bairro: "Centro",
      numero: 123,
      cep: 60000000,
    },
  });
}

async function criarUsuarioTeste(params: {
  usuarioId: string;
  identidadeId: string;
  tituloId: string;
  cargoId: number;
  nome: string;
  email: string;
  cpf: string;
  rg: string;
  tituloNumero: string;
  enderecoId: number;
  aluno?: { id: string; matricula: string };
  professor?: { id: string; siape: string };
}) {
  const senha = await bcrypt.hash(TEST_PASSWORD, 10);

  await prisma.identidade.upsert({
    where: { id: params.identidadeId },
    update: {
      rg: params.rg,
      cpf: params.cpf,
      orgaoEmissor: "SSP",
      estado: "CE",
      dataExpedicao: new Date("2020-01-01"),
    },
    create: {
      id: params.identidadeId,
      rg: params.rg,
      cpf: params.cpf,
      orgaoEmissor: "SSP",
      estado: "CE",
      dataExpedicao: new Date("2020-01-01"),
    },
  });

  await prisma.usuario.upsert({
    where: { id: params.usuarioId },
    update: {
      nome: params.nome,
      emailInstitucional: params.email,
      emailSecundario: params.email,
      senha,
      nomeMae: "Maria Teste",
      nomePai: "Joao Teste",
      dataNasc: new Date("1995-01-01"),
      naturalidade: "Cedro",
      sexo: "MASCULINO",
      raca: "NAO_DECLARADO",
      fkIdentidade: params.identidadeId,
      fkEndereco: params.enderecoId,
      cargos: { set: [{ id: params.cargoId }] },
    },
    create: {
      id: params.usuarioId,
      nome: params.nome,
      emailInstitucional: params.email,
      emailSecundario: params.email,
      senha,
      nomeMae: "Maria Teste",
      nomePai: "Joao Teste",
      dataNasc: new Date("1995-01-01"),
      naturalidade: "Cedro",
      sexo: "MASCULINO",
      raca: "NAO_DECLARADO",
      fkIdentidade: params.identidadeId,
      fkEndereco: params.enderecoId,
      cargos: { connect: [{ id: params.cargoId }] },
    },
  });

  await prisma.tituloEleitor.upsert({
    where: { fkUsuario: params.usuarioId },
    update: {
      numero: params.tituloNumero,
      zonaEleitoral: "001",
      secaoEleitoral: "001",
      UF: "CE",
    },
    create: {
      id: params.tituloId,
      numero: params.tituloNumero,
      zonaEleitoral: "001",
      secaoEleitoral: "001",
      UF: "CE",
      fkUsuario: params.usuarioId,
    },
  });

  if (params.aluno) {
    await prisma.aluno.upsert({
      where: { id: params.aluno.id },
      update: {
        matricula: params.aluno.matricula,
        fkUsuario: params.usuarioId,
      },
      create: {
        id: params.aluno.id,
        matricula: params.aluno.matricula,
        fkUsuario: params.usuarioId,
      },
    });
  }

  if (params.professor) {
    await prisma.professor.upsert({
      where: { id: params.professor.id },
      update: {
        siape: params.professor.siape,
        fkUsuario: params.usuarioId,
      },
      create: {
        id: params.professor.id,
        siape: params.professor.siape,
        fkUsuario: params.usuarioId,
      },
    });
  }
}

async function garantirSupabaseBuckets() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    console.log("Supabase não configurado no ambiente do seed; buckets não foram verificados.");
    return;
  }

  const supabase = createClient(url, key);
  const buckets = [
    { id: BUCKET_DOCS, public: true },
    { id: BUCKET_IMAGEM, public: true },
  ];

  for (const bucket of buckets) {
    const { data } = await supabase.storage.getBucket(bucket.id);
    if (!data) {
      const { error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
      });
      if (error && !error.message.toLowerCase().includes("already exists")) {
        throw new Error(`Erro ao criar bucket ${bucket.id}: ${error.message}`);
      }
    }
  }
}

async function main() {
  console.log("Iniciando seed do DEPPI...");

  await garantirPermissoesECargos();
  const endereco = await garantirEndereco();

  await criarUsuarioTeste({
    usuarioId: IDS.usuarioAdmin,
    identidadeId: IDS.identidadeAdmin,
    tituloId: IDS.tituloAdmin,
    cargoId: 4,
    nome: "Administrador Teste",
    email: "admin.teste@deppi.com",
    cpf: "11111111111",
    rg: "111111111",
    tituloNumero: "111111111111",
    enderecoId: endereco.id,
  });

  await criarUsuarioTeste({
    usuarioId: IDS.usuarioDeppi,
    identidadeId: IDS.identidadeDeppi,
    tituloId: IDS.tituloDeppi,
    cargoId: 3,
    nome: "DEPPI Teste",
    email: "deppi.teste@deppi.com",
    cpf: "22222222222",
    rg: "222222222",
    tituloNumero: "222222222222",
    enderecoId: endereco.id,
  });

  await criarUsuarioTeste({
    usuarioId: IDS.usuarioProfessor,
    identidadeId: IDS.identidadeProfessor,
    tituloId: IDS.tituloProfessor,
    cargoId: 2,
    nome: "Professor Teste",
    email: "professor.teste@deppi.com",
    cpf: "33333333333",
    rg: "333333333",
    tituloNumero: "333333333333",
    enderecoId: endereco.id,
    professor: {
      id: IDS.professor,
      siape: "TESTE001",
    },
  });

  await criarUsuarioTeste({
    usuarioId: IDS.usuarioAluno,
    identidadeId: IDS.identidadeAluno,
    tituloId: IDS.tituloAluno,
    cargoId: 1,
    nome: "Aluno Teste",
    email: "aluno.teste@deppi.com",
    cpf: "44444444444",
    rg: "444444444",
    tituloNumero: "444444444444",
    enderecoId: endereco.id,
    aluno: {
      id: IDS.aluno,
      matricula: "ALUNO001",
    },
  });

  await prisma.instituicao.upsert({
    where: { id: IDS.instituicao },
    update: {
      nome: "Instituicao Teste DEPPI",
      cidade: "Cedro",
      campus: "Campus Teste",
      cnpj: "11111111000111",
    },
    create: {
      id: IDS.instituicao,
      nome: "Instituicao Teste DEPPI",
      cidade: "Cedro",
      campus: "Campus Teste",
      cnpj: "11111111000111",
    },
  });

  await prisma.curso.upsert({
    where: { id: IDS.curso },
    update: {
      nome: "Curso Teste DEPPI",
      carga_horaria: 40,
      vagas: 20,
      status: "ANDAMENTO",
      dataInicio: new Date("2026-10-10"),
      dataFim: new Date("2026-12-10"),
      horarioInicio: new Date("1970-01-01T18:00:00.000Z"),
      horarioFim: new Date("1970-01-01T20:00:00.000Z"),
      fkInstituicao: IDS.instituicao,
    },
    create: {
      id: IDS.curso,
      nome: "Curso Teste DEPPI",
      carga_horaria: 40,
      vagas: 20,
      status: "ANDAMENTO",
      dataInicio: new Date("2026-10-10"),
      dataFim: new Date("2026-12-10"),
      horarioInicio: new Date("1970-01-01T18:00:00.000Z"),
      horarioFim: new Date("1970-01-01T20:00:00.000Z"),
      fkInstituicao: IDS.instituicao,
    },
  });

  await prisma.alocacaoProfessor.upsert({
    where: {
      fkProfessor_fkCurso: {
        fkProfessor: IDS.professor,
        fkCurso: IDS.curso,
      },
    },
    update: {
      cargaHoraria: 40,
    },
    create: {
      id: IDS.alocacao,
      fkProfessor: IDS.professor,
      fkCurso: IDS.curso,
      cargaHoraria: 40,
    },
  });

  await prisma.inscricao.upsert({
    where: { id: IDS.inscricao },
    update: {
      status: "PENDENTE",
      fkAluno: IDS.aluno,
      fkCurso: IDS.curso,
    },
    create: {
      id: IDS.inscricao,
      status: "PENDENTE",
      fkAluno: IDS.aluno,
      fkCurso: IDS.curso,
    },
  });

  await garantirSupabaseBuckets();

  console.log("Seed concluído.");
  console.log("Usuários de teste:");
  console.log("  ADMIN:     admin.teste@deppi.com");
  console.log("  DEPPI:     deppi.teste@deppi.com");
  console.log("  PROFESSOR: professor.teste@deppi.com");
  console.log("  ALUNO:     aluno.teste@deppi.com");
  console.log(`  Senha:     ${TEST_PASSWORD}`);
  console.log(`  Curso:     ${IDS.curso}`);
  console.log(`  Inscrição: ${IDS.inscricao}`);
}

main()
  .catch((error) => {
    console.error("Erro no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
