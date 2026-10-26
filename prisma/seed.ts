import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

type RoleName = "ALUNO" | "PROFESSOR" | "DEPPI" | "ADMIN";

const permissionDefinitions = [
  { permissao: "VER", desc: "Permite acessar o sistema (Login)." },
  { permissao: "GERENCIAR_PERFIL", desc: "Permite visualizar e editar o próprio perfil." },
  { permissao: "FAZER_INSCRICAO", desc: "Permite realizar inscrições em cursos abertos." },
  { permissao: "ACOMPANHAR_INSCRICAO", desc: "Permite acompanhar as próprias inscrições." },
  { permissao: "CRIAR_CURSO", desc: "Permite criar cursos." },
  { permissao: "ACOMPANHAR_CURSO", desc: "Permite acompanhar os próprios cursos e inscritos." },
  { permissao: "CRIAR_PROFESSOR", desc: "Permite criar contas de professores." },
  { permissao: "GERENCIAR_PROFESSOR", desc: "Permite listar, editar e excluir professores." },
  { permissao: "GERENCIAR_CURSO", desc: "Permite gerenciar todos os cursos." },
  { permissao: "GERENCIAR_INSCRICAO", desc: "Permite gerenciar todas as inscrições." },
  { permissao: "GERENCIAR_PERMISSAO", desc: "Permite gerenciar cargos e permissões." },
  { permissao: "GERENCIAR_INSTITUICAO", desc: "Permite gerenciar instituições." },
  { permissao: "GERENCIAR_DEPPI", desc: "Permite criar e gerenciar contas DEPPI." },
  { permissao: "CRIAR_ALUNO", desc: "Permite criar contas de alunos." },
  { permissao: "GERENCIAR_ALUNO", desc: "Permite gerenciar contas de alunos." },
  { permissao: "GERAR_RELATORIO", desc: "Permite gerar relatórios gerais." },
  { permissao: "VER_DASHBOARD", desc: "Permite visualizar o dashboard administrativo." },
  { permissao: "ADMIN", desc: "Permite acesso administrativo total." },
] as const;

const roleDefinitions: {
  id: number;
  cargo: RoleName;
  desc: string;
  permissions: string[];
}[] = [
  {
    id: 1,
    cargo: "ALUNO",
    desc: "DISCENTE",
    permissions: ["VER", "GERENCIAR_PERFIL", "FAZER_INSCRICAO", "ACOMPANHAR_INSCRICAO"],
  },
  {
    id: 2,
    cargo: "PROFESSOR",
    desc: "DOCENTE",
    permissions: ["VER", "GERENCIAR_PERFIL", "CRIAR_CURSO", "ACOMPANHAR_CURSO"],
  },
  {
    id: 3,
    cargo: "DEPPI",
    desc: "MEMBRO DO DEPARTAMENTO",
    permissions: [
      "VER", "GERENCIAR_PERFIL", "CRIAR_PROFESSOR", "GERENCIAR_PROFESSOR",
      "GERENCIAR_CURSO", "GERENCIAR_INSCRICAO", "GERENCIAR_PERMISSAO",
    ],
  },
  {
    id: 4,
    cargo: "ADMIN",
    desc: "ADMINISTRADOR DO SISTEMA",
    // O middleware não interpreta ADMIN como bypass automático; por isso,
    // o administrador recebe explicitamente todas as permissões cadastradas.
    permissions: permissionDefinitions.map((p) => p.permissao),
  },
];

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value.length < 12) {
    throw new Error(`${name} é obrigatório e deve ter pelo menos 12 caracteres.`);
  }
  return value;
}

const testUsers: {
  role: RoleName;
  roleId: number;
  emailEnv: string;
  passwordEnv: string;
  emailDefault: string;
  name: string;
  cpf: string;
  rg: string;
  matricula?: string;
  siape?: string;
}[] = [
  {
    role: "ADMIN", roleId: 4, emailEnv: "SEED_ADMIN_EMAIL",
    passwordEnv: "SEED_ADMIN_PASSWORD", emailDefault: "admin.teste@deppi.edu.br",
    name: "Administrador de Teste", cpf: "00000000001", rg: "SEED-RG-ADMIN",
  },
  {
    role: "DEPPI", roleId: 3, emailEnv: "SEED_DEPPI_EMAIL",
    passwordEnv: "SEED_DEPPI_PASSWORD", emailDefault: "deppi.teste@deppi.edu.br",
    name: "Servidor DEPPI de Teste", cpf: "00000000002", rg: "SEED-RG-DEPPI",
  },
  {
    role: "PROFESSOR", roleId: 2, emailEnv: "SEED_PROFESSOR_EMAIL",
    passwordEnv: "SEED_PROFESSOR_PASSWORD", emailDefault: "professor.teste@deppi.edu.br",
    name: "Professor de Teste", cpf: "00000000003", rg: "SEED-RG-PROFESSOR",
    siape: "SEED-SIAPE-001",
  },
  {
    role: "ALUNO", roleId: 1, emailEnv: "SEED_ALUNO_EMAIL",
    passwordEnv: "SEED_ALUNO_PASSWORD", emailDefault: "aluno.teste@deppi.edu.br",
    name: "Aluno de Teste", cpf: "00000000004", rg: "SEED-RG-ALUNO",
    matricula: "SEED-MAT-001",
  },
];

async function ensurePermissions() {
  const map = new Map<string, number>();
  for (const definition of permissionDefinitions) {
    const existing = await prisma.permissoes.findFirst({
      where: { permissao: definition.permissao },
    });
    const permission = existing
      ? await prisma.permissoes.update({
          where: { id: existing.id },
          data: { desc: definition.desc },
        })
      : await prisma.permissoes.create({ data: definition });
    map.set(definition.permissao, permission.id);
  }
  return map;
}

async function ensureRoles(permissionIds: Map<string, number>) {
  for (const role of roleDefinitions) {
    const ids = role.permissions.map((name) => {
      const id = permissionIds.get(name);
      if (!id) throw new Error(`Permissão não encontrada: ${name}`);
      return id;
    });

    await prisma.cargo.upsert({
      where: { id: role.id },
      update: {
        cargo: role.cargo,
        desc: role.desc,
        permissoes: { set: ids.map((id) => ({ id })) },
      },
      create: {
        id: role.id,
        cargo: role.cargo,
        desc: role.desc,
        permissoes: { connect: ids.map((id) => ({ id })) },
      },
    });
  }
}

async function ensureAddress(): Promise<number> {
  const address = await prisma.endereco.findFirst({
    where: { rua: "Endereço de teste seed", bairro: "Centro" },
  });
  if (address) return address.id;

  const created = await prisma.endereco.create({
    data: { rua: "Endereço de teste seed", bairro: "Centro", numero: 1, cep: 60000000 },
  });
  return created.id;
}

async function ensureTestUser(
  user: (typeof testUsers)[number],
  addressId: number,
  hashedPassword: string,
) {
  const email = (process.env[user.emailEnv] || user.emailDefault).trim().toLowerCase();
  const existingUser = await prisma.usuario.findUnique({
    where: { emailInstitucional: email },
    include: { identidade: true, alunos: true, professor: true, tituloEleitor: true },
  });

  let userId: string;

  if (existingUser) {
    // Conta de teste gerenciada pela seed: atualiza senha e garante o cargo esperado.
    const updated = await prisma.usuario.update({
      where: { id: existingUser.id },
      data: {
        nome: user.name,
        senha: hashedPassword,
        cargos: { set: [{ id: user.roleId }] },
      },
    });
    userId = updated.id;
  } else {
    const identity = await prisma.identidade.create({
      data: {
        rg: user.rg,
        cpf: user.cpf,
        orgaoEmissor: "SSP",
        estado: "CE",
        dataExpedicao: new Date("2020-01-01T12:00:00.000Z"),
      },
    });

    const created = await prisma.usuario.create({
      data: {
        nome: user.name,
        dataNasc: new Date("2000-01-01T12:00:00.000Z"),
        naturalidade: "Fortaleza - CE",
        emailInstitucional: email,
        emailSecundario: email,
        senha: hashedPassword,
        nomeMae: "Mãe de Teste",
        nomePai: "Pai de Teste",
        sexo: "MASCULINO",
        raca: "NAO_DECLARADO",
        identidade: { connect: { id: identity.id } },
        endereco: { connect: { id: addressId } },
        cargos: { connect: { id: user.roleId } },
      },
    });
    userId = created.id;
  }

  if (user.role === "ALUNO") {
    const current = await prisma.aluno.findUnique({ where: { fkUsuario: userId } });
    if (!current) {
      await prisma.aluno.create({
        data: { fkUsuario: userId, matricula: user.matricula! },
      });
    }
  }

  if (user.role === "PROFESSOR") {
    const current = await prisma.professor.findUnique({ where: { fkUsuario: userId } });
    if (!current) {
      await prisma.professor.create({
        data: { fkUsuario: userId, siape: user.siape! },
      });
    }
  }

  const title = await prisma.tituloEleitor.findUnique({ where: { fkUsuario: userId } });
  if (!title) {
    await prisma.tituloEleitor.create({
      data: {
        numero: `SEED-TITULO-${user.role}`,
        zonaEleitoral: "001",
        secaoEleitoral: "0001",
        UF: "CE",
        fkUsuario: userId,
      },
    });
  }

  console.log(`✓ ${user.role}: ${email}`);
}

async function main() {
  if (process.env.SEED_DEMO_USERS !== "true") {
    throw new Error(
      "Seed de contas de teste bloqueada. Defina SEED_DEMO_USERS=true explicitamente para executá-la.",
    );
  }

  // Exige senhas definidas no ambiente; não há senha padrão embutida no código.
  const passwords = new Map<RoleName, string>(
    testUsers.map((user) => [user.role, requiredEnv(user.passwordEnv)] as const),
  );

  const permissionIds = await ensurePermissions();
  await ensureRoles(permissionIds);
  const addressId = await ensureAddress();

  for (const user of testUsers) {
    const hashedPassword = await bcrypt.hash(passwords.get(user.role)!, 12);
    await ensureTestUser(user, addressId, hashedPassword);
  }

  console.log("Seed concluída. Altere/rotacione as senhas após os testes.");
}

main()
  .catch((error) => {
    console.error("Falha ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
