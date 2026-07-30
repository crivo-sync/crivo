import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppointmentStatus, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Senha única para todos os usuários de desenvolvimento. */
const DEV_PASSWORD = 'senha12345';
const SALT_ROUNDS = 10;

type SeedUser = {
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
};

type SeedPatient = {
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
};

type SeedProfessional = {
  name: string;
  specialty: string;
  councilCode: string;
};

type SeedProcedure = {
  name: string;
  description?: string;
  durationMinutes: number;
  priceInCents: number;
};

type SeedTenant = {
  name: string;
  subdomain: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  email: string;
  address: string;
  users: SeedUser[];
  patients: SeedPatient[];
  professionals: SeedProfessional[];
  procedures: SeedProcedure[];
};

/**
 * Dois tenants de propósito: é o mínimo para conseguir testar isolamento
 * multi-tenant (garantir que a clínica A nunca enxerga dados da B).
 */
const TENANTS: SeedTenant[] = [
  {
    name: 'Clínica Sorriso',
    subdomain: 'clinica-sorriso',
    logoUrl: 'https://placehold.co/200x60/4F46E5/FFFFFF/png?text=Sorriso',
    primaryColor: '#4F46E5',
    secondaryColor: '#22D3EE',
    phone: '1133334444',
    email: 'contato@clinicasorriso.com.br',
    address: 'Av. Paulista, 1000 — São Paulo/SP',
    users: [
      {
        name: 'Dra. Helena Prado',
        email: 'admin@clinicasorriso.com.br',
        role: Role.ADMIN,
      },
      {
        name: 'Marina Ribeiro',
        email: 'recepcao@clinicasorriso.com.br',
        role: Role.STAFF,
      },
      {
        name: 'Dr. Paulo Nogueira',
        email: 'paulo@clinicasorriso.com.br',
        role: Role.STAFF,
      },
      // Usuário inativo: serve para validar que login/token são bloqueados.
      {
        name: 'Ex-Funcionário',
        email: 'inativo@clinicasorriso.com.br',
        role: Role.STAFF,
        isActive: false,
      },
    ],
    patients: [
      {
        name: 'Ana Souza',
        phone: '11987650001',
        cpf: '11122233344',
        email: 'ana.souza@email.com',
      },
      {
        name: 'Bruno Carvalho',
        phone: '11987650002',
        cpf: '22233344455',
        email: 'bruno.c@email.com',
      },
      { name: 'Carla Mendes', phone: '11987650003', cpf: '33344455566' },
      {
        name: 'Diego Almeida',
        phone: '11987650004',
        email: 'diego.a@email.com',
      },
      {
        name: 'Elisa Barbosa',
        phone: '11987650005',
        cpf: '44455566677',
        email: 'elisa.b@email.com',
      },
      { name: 'Fábio Torres', phone: '11987650006' },
      {
        name: 'Gabriela Lima',
        phone: '11987650007',
        cpf: '55566677788',
        email: 'gabi.lima@email.com',
      },
      { name: 'Henrique Dias', phone: '11987650008', cpf: '66677788899' },
      {
        name: 'Isabela Rocha',
        phone: '11987650009',
        email: 'isabela.r@email.com',
      },
      { name: 'João Pedro Martins', phone: '11987650010', cpf: '77788899900' },
      {
        name: 'Karina Fonseca',
        phone: '11987650011',
        cpf: '88899900011',
        email: 'karina.f@email.com',
      },
      { name: 'Lucas Moreira', phone: '11987650012' },
    ],
    professionals: [
      {
        name: 'Dra. Helena Prado',
        specialty: 'Ortodontia',
        councilCode: 'CRO-SP 45821',
      },
      {
        name: 'Dr. Paulo Nogueira',
        specialty: 'Implantodontia',
        councilCode: 'CRO-SP 51203',
      },
    ],
    procedures: [
      {
        name: 'Consulta de avaliação',
        description: 'Primeira consulta com diagnóstico e plano de tratamento',
        durationMinutes: 30,
        priceInCents: 15000,
      },
      {
        name: 'Limpeza dental',
        description: 'Profilaxia e remoção de tártaro',
        durationMinutes: 45,
        priceInCents: 20000,
      },
      {
        name: 'Restauração',
        durationMinutes: 60,
        priceInCents: 35000,
      },
      {
        name: 'Manutenção de aparelho',
        durationMinutes: 30,
        priceInCents: 18000,
      },
    ],
  },
  {
    name: 'Estética Bella',
    subdomain: 'estetica-bella',
    logoUrl: 'https://placehold.co/200x60/DB2777/FFFFFF/png?text=Bella',
    primaryColor: '#DB2777',
    secondaryColor: '#FBBF24',
    phone: '2144445555',
    email: 'contato@esteticabella.com.br',
    address: 'Rua das Laranjeiras, 250 — Rio de Janeiro/RJ',
    users: [
      {
        name: 'Renata Villar',
        email: 'admin@esteticabella.com.br',
        role: Role.ADMIN,
      },
      {
        name: 'Tatiane Gomes',
        email: 'recepcao@esteticabella.com.br',
        role: Role.STAFF,
      },
    ],
    patients: [
      {
        name: 'Mariana Castro',
        phone: '21987650001',
        cpf: '99900011122',
        email: 'mari.castro@email.com',
      },
      { name: 'Natália Freitas', phone: '21987650002', cpf: '10011122233' },
      {
        name: 'Otávio Ramos',
        phone: '21987650003',
        email: 'otavio.r@email.com',
      },
      {
        name: 'Priscila Nunes',
        phone: '21987650004',
        cpf: '11122233355',
        email: 'pri.nunes@email.com',
      },
      { name: 'Rafael Pinto', phone: '21987650005' },
      {
        name: 'Sofia Andrade',
        phone: '21987650006',
        cpf: '12233344466',
        email: 'sofia.a@email.com',
      },
      { name: 'Thiago Cardoso', phone: '21987650007', cpf: '13344455577' },
      {
        name: 'Vanessa Cunha',
        phone: '21987650008',
        email: 'vanessa.c@email.com',
      },
    ],
    professionals: [
      {
        name: 'Renata Villar',
        specialty: 'Estética facial',
        councilCode: 'CRBM-RJ 8842',
      },
    ],
    procedures: [
      {
        name: 'Limpeza de pele',
        description: 'Higienização profunda com extração',
        durationMinutes: 60,
        priceInCents: 18000,
      },
      {
        name: 'Aplicação de toxina botulínica',
        durationMinutes: 45,
        priceInCents: 90000,
      },
      {
        name: 'Drenagem linfática',
        durationMinutes: 50,
        priceInCents: 12000,
      },
    ],
  },
];

async function clean() {
  // Ordem importa: filhos antes dos pais por causa das foreign keys.
  await prisma.message.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('🧹 Banco limpo (todas as tabelas).');
}

/** Data relativa a hoje, às `hour`:`minute` em ponto. */
function dayAt(offsetDays: number, hour: number, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * Agenda de exemplo: mistura passado (com faltas e cancelamentos) e futuro.
 * O histórico de NO_SHOW é justamente o que o módulo `prediction` vai consumir,
 * então o seed precisa produzir esse dado desde já.
 */
async function seedAppointments(tenantId: string): Promise<number> {
  const alreadySeeded = await prisma.appointment.count({ where: { tenantId } });

  if (alreadySeeded > 0) {
    return alreadySeeded;
  }

  const [patients, professionals, procedures] = await Promise.all([
    prisma.patient.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    prisma.professional.findMany({ where: { tenantId } }),
    prisma.procedure.findMany({ where: { tenantId } }),
  ]);

  if (!patients.length || !professionals.length || !procedures.length) {
    return 0;
  }

  // [offset em dias, hora, status] — offsets negativos são histórico.
  const plan: [number, number, AppointmentStatus][] = [
    [-30, 9, AppointmentStatus.COMPLETED],
    [-28, 10, AppointmentStatus.COMPLETED],
    [-21, 14, AppointmentStatus.NO_SHOW],
    [-20, 9, AppointmentStatus.COMPLETED],
    [-14, 16, AppointmentStatus.CANCELLED],
    [-10, 11, AppointmentStatus.COMPLETED],
    [-7, 15, AppointmentStatus.NO_SHOW],
    [-3, 9, AppointmentStatus.COMPLETED],
    [1, 9, AppointmentStatus.CONFIRMED],
    [1, 14, AppointmentStatus.SCHEDULED],
    [2, 10, AppointmentStatus.SCHEDULED],
    [3, 11, AppointmentStatus.CONFIRMED],
    [5, 15, AppointmentStatus.SCHEDULED],
    [7, 9, AppointmentStatus.SCHEDULED],
  ];

  let created = 0;

  for (const [index, [offsetDays, hour, status]] of plan.entries()) {
    const patient = patients[index % patients.length];
    const professional = professionals[index % professionals.length];
    const procedure = procedures[index % procedures.length];

    const startsAt = dayAt(offsetDays, hour);
    const endsAt = new Date(
      startsAt.getTime() + procedure.durationMinutes * 60_000,
    );

    await prisma.appointment.create({
      data: {
        tenantId,
        patientId: patient.id,
        professionalId: professional.id,
        procedureId: procedure.id,
        startsAt,
        endsAt,
        status,
        priceInCents: procedure.priceInCents,
        confirmedAt:
          status === AppointmentStatus.CONFIRMED ? new Date() : undefined,
        cancelledAt:
          status === AppointmentStatus.CANCELLED ? startsAt : undefined,
        cancelReason:
          status === AppointmentStatus.CANCELLED
            ? 'Paciente remarcou por telefone'
            : undefined,
      },
    });

    created += 1;
  }

  return created;
}

async function full() {
  const hashedPassword = await bcrypt.hash(DEV_PASSWORD, SALT_ROUNDS);

  for (const seedTenant of TENANTS) {
    const { users, patients, professionals, procedures, ...tenantData } =
      seedTenant;

    // Upsert por subdomain: rodar o seed duas vezes não duplica nada.
    const tenant = await prisma.tenant.upsert({
      where: { subdomain: tenantData.subdomain },
      update: tenantData,
      create: tenantData,
    });

    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          isActive: user.isActive ?? true,
        },
        create: {
          tenantId: tenant.id,
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          isActive: user.isActive ?? true,
        },
      });
    }

    for (const patient of patients) {
      // Sem CPF não há chave natural para upsert — evita duplicar checando antes.
      if (!patient.cpf) {
        const exists = await prisma.patient.findFirst({
          where: { tenantId: tenant.id, name: patient.name },
          select: { id: true },
        });

        if (!exists) {
          await prisma.patient.create({
            data: { ...patient, tenantId: tenant.id },
          });
        }

        continue;
      }

      await prisma.patient.upsert({
        where: {
          tenantId_cpf: { tenantId: tenant.id, cpf: patient.cpf },
        },
        update: {
          name: patient.name,
          phone: patient.phone,
          email: patient.email ?? null,
        },
        create: { ...patient, tenantId: tenant.id },
      });
    }

    for (const professional of professionals) {
      const exists = await prisma.professional.findFirst({
        where: { tenantId: tenant.id, name: professional.name },
        select: { id: true },
      });

      if (!exists) {
        await prisma.professional.create({
          data: { ...professional, tenantId: tenant.id },
        });
      }
    }

    for (const procedure of procedures) {
      const exists = await prisma.procedure.findFirst({
        where: { tenantId: tenant.id, name: procedure.name },
        select: { id: true },
      });

      if (!exists) {
        await prisma.procedure.create({
          data: { ...procedure, tenantId: tenant.id },
        });
      }
    }

    const appointmentCount = await seedAppointments(tenant.id);

    console.log(
      `✅ ${tenant.name} (${tenant.subdomain}) — ${users.length} usuários, ${patients.length} pacientes, ${professionals.length} profissionais, ${procedures.length} procedimentos, ${appointmentCount} agendamentos`,
    );
  }

  console.log(`\n🔑 Senha de todos os usuários: ${DEV_PASSWORD}`);
  console.log('   Logins ADMIN:');
  for (const tenant of TENANTS) {
    const admin = tenant.users.find((user) => user.role === Role.ADMIN);
    console.log(`   - ${admin?.email} (${tenant.name})`);
  }
}

async function main() {
  const mode = process.env.SEED_TYPE ?? 'full';

  switch (mode) {
    case 'clean':
      await clean();
      break;
    case 'full':
      await full();
      break;
    default:
      throw new Error(`SEED_TYPE inválido: "${mode}". Use "full" ou "clean".`);
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed falhou:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
