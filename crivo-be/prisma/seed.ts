import 'dotenv/config';
import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  AppointmentOrigin,
  AppointmentStatus,
  MessageStatus,
  MessageType,
  MessagingProvider,
  Prisma,
  PrismaClient,
  ReplyIntent,
  Role,
  SubscriptionStatus,
  WaitlistStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

import {
  clinicDateKey,
  clinicWeekday,
  fromClinicWallClock,
} from '../src/shared/clinic-time';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Senha padrão dos usuários de desenvolvimento (quem não define a própria). */
const DEV_PASSWORD = 'senha12345';
const SALT_ROUNDS = 10;

/** Janela da agenda gerada: histórico (matéria-prima da predição) e futuro. */
const HISTORY_DAYS = 60;
const FUTURE_DAYS = 30;

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

type Window = { weekday: number; startMinutes: number; endMinutes: number };

type SeedUser = {
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  /** Senha própria. Ausente = `DEV_PASSWORD`. */
  password?: string;
};

type SeedPatient = {
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
  /**
   * Paciente que falta muito: gera histórico de NO_SHOW e nunca confirma as
   * consultas futuras — é o que faz a aba "Risco de falta" ter caso HIGH.
   */
  faltoso?: boolean;
  /** Soft delete: testa que o paciente some das listas sem perder histórico. */
  deleted?: boolean;
};

type SeedProfessional = {
  name: string;
  specialty: string;
  councilCode: string;
  phone?: string;
  email?: string;
  /** E-mail do usuário que é este profissional (liga `Professional.userId`). */
  userEmail?: string;
  /** Nomes dos procedimentos que realiza. Ausente/vazio = faz todos. */
  procedures?: string[];
  /** Grade semanal. Ausente = herda o expediente da clínica. */
  schedule?: Window[];
  /** Ausências em dias relativos a hoje (inclusive nas duas pontas). */
  timeOff?: { fromDay: number; toDay: number; reason: string }[];
  isActive?: boolean;
};

type SeedProcedure = {
  name: string;
  description?: string;
  durationMinutes: number;
  priceInCents: number;
  isActive?: boolean;
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
  businessDays?: number[];
  businessHoursStart?: number;
  businessHoursEnd?: number;
  users: SeedUser[];
  patients: SeedPatient[];
  professionals: SeedProfessional[];
  procedures: SeedProcedure[];
  messageTemplates?: { type: MessageType; body: string }[];
};

/** "segunda a sexta, 08:00–12:00" sem repetir objeto na mão. */
function windows(weekdays: number[], start: number, end: number): Window[] {
  return weekdays.map((weekday) => ({
    weekday,
    startMinutes: start,
    endMinutes: end,
  }));
}

/** CPF com dígitos verificadores válidos, a partir de 9 dígitos de base. */
function cpf(base: number): string {
  const digits = String(base).padStart(9, '0').split('').map(Number);

  for (const length of [9, 10]) {
    const sum = digits
      .slice(0, length)
      .reduce((acc, digit, index) => acc + digit * (length + 1 - index), 0);
    const rest = (sum * 10) % 11;
    digits.push(rest === 10 ? 0 : rest);
  }

  return digits.join('');
}

const FIRST_NAMES = [
  'Amanda',
  'Bernardo',
  'Cecília',
  'Davi',
  'Eduarda',
  'Felipe',
  'Giovana',
  'Heitor',
  'Ingrid',
  'Júlio',
  'Larissa',
  'Mateus',
  'Nicole',
  'Otávio',
  'Patrícia',
  'Renan',
  'Sabrina',
  'Tiago',
  'Valéria',
  'Wesley',
  'Yasmin',
  'Arthur',
  'Beatriz',
  'Caio',
  'Débora',
  'Enzo',
  'Fernanda',
  'Gustavo',
  'Helena',
  'Igor',
];

const LAST_NAMES = [
  'Albuquerque',
  'Barros',
  'Campos',
  'Duarte',
  'Esteves',
  'Farias',
  'Guimarães',
  'Hoffmann',
  'Lacerda',
  'Macedo',
  'Nascimento',
  'Oliveira',
  'Pacheco',
  'Queiroz',
  'Rezende',
  'Siqueira',
  'Teixeira',
  'Vasconcelos',
];

/**
 * Pacientes do tenant de desenvolvimento, gerados em vez de escritos à mão:
 * 60 cadastros é o volume que deixa a agenda, o painel e a paginação com cara
 * de clínica real.
 */
function generatedPatients(count: number): SeedPatient[] {
  return Array.from({ length: count }, (_, index) => {
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const last = LAST_NAMES[(index * 7) % LAST_NAMES.length];
    const slug = `${first}.${last}`
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();

    return {
      name: `${first} ${last}`,
      phone: `11980${String(index).padStart(6, '0')}`,
      // Nem todo cadastro tem CPF/e-mail — a recepção cadastra com o mínimo.
      cpf: index % 5 === 4 ? undefined : cpf(300_000_000 + index * 7919),
      email: index % 3 === 2 ? undefined : `${slug}${index}@email.com`,
      faltoso: index % 12 === 5,
    };
  });
}

/**
 * Três tenants:
 *
 * - **g3developer** — a clínica de desenvolvimento do dono do projeto, com
 *   agenda cheia e todos os módulos com dado (o login que se usa no dia a dia).
 * - **Clínica Sorriso** e **Estética Bella** — o par mínimo para testar
 *   isolamento multi-tenant (a clínica A nunca enxerga dados da B) e RBAC.
 */
const TENANTS: SeedTenant[] = [
  {
    name: 'g3developer',
    subdomain: 'g3developer',
    logoUrl: 'https://placehold.co/200x60/4338CA/FFFFFF/png?text=g3developer',
    primaryColor: '#4338CA',
    secondaryColor: '#14B8A6',
    phone: '11940028922',
    email: 'contato@g3developer.dev',
    address: 'Rua Augusta, 1500 — Consolação, São Paulo/SP',
    // Segunda a sábado, 08:00–19:00: o sábado existe para a grade de quem
    // atende só no fim de semana ter onde cair.
    businessDays: [1, 2, 3, 4, 5, 6],
    businessHoursStart: 480,
    businessHoursEnd: 1140,
    users: [
      {
        name: 'Geraldo Luiz',
        email: 'geraldobl58@gmail.com',
        role: Role.ADMIN,
        password: 'Ger@1234',
      },
      {
        name: 'Dra. Camila Duarte',
        email: 'camila@g3developer.dev',
        role: Role.PROFESSIONAL,
      },
      {
        name: 'Dr. Rafael Costa',
        email: 'rafael@g3developer.dev',
        role: Role.PROFESSIONAL,
      },
      {
        name: 'Juliana Alves',
        email: 'recepcao@g3developer.dev',
        role: Role.STAFF,
      },
    ],
    patients: [
      ...generatedPatients(60),
      {
        name: 'Paciente Removido',
        phone: '11989999999',
        cpf: cpf(399_999_999),
        deleted: true,
      },
    ],
    professionals: [
      {
        name: 'Dra. Camila Duarte',
        specialty: 'Odontologia',
        councilCode: 'CRO-SP 61234',
        email: 'camila@g3developer.dev',
        userEmail: 'camila@g3developer.dev',
        procedures: [
          'Avaliação odontológica',
          'Limpeza dental',
          'Restauração',
          'Clareamento dental',
        ],
        // Duas faixas por dia: o intervalo de almoço que a modelagem
        // "uma linha por faixa" existe para cobrir.
        schedule: [
          ...windows([1, 2, 3, 4, 5], 480, 720),
          ...windows([1, 2, 3, 4, 5], 780, 1080),
        ],
      },
      {
        name: 'Dr. Rafael Costa',
        specialty: 'Fisioterapia',
        councilCode: 'CREFITO-3 123456-F',
        email: 'rafael@g3developer.dev',
        userEmail: 'rafael@g3developer.dev',
        procedures: [
          'Avaliação fisioterapêutica',
          'Sessão de fisioterapia',
          'RPG',
        ],
        // Sem grade: herda o expediente inteiro da clínica (seg–sáb).
      },
      {
        name: 'Dra. Beatriz Lemos',
        specialty: 'Estética facial',
        councilCode: 'CRBM-SP 12345',
        phone: '11977776666',
        procedures: [
          'Limpeza de pele',
          'Toxina botulínica',
          'Preenchimento labial',
          'Peeling químico',
        ],
        // Atende à tarde em dias alternados e no sábado de manhã — sem login.
        schedule: [...windows([2, 4], 780, 1140), ...windows([6], 480, 780)],
        timeOff: [{ fromDay: 10, toDay: 12, reason: 'Congresso de estética' }],
      },
      {
        name: 'Marcos Vinícius',
        specialty: 'Nutrição',
        councilCode: 'CRN-3 45678',
        procedures: ['Consulta nutricional', 'Retorno nutricional'],
        schedule: windows([1, 3, 5], 480, 720),
        timeOff: [{ fromDay: 21, toDay: 26, reason: 'Férias' }],
      },
      // Desligado: testa que some da agenda e do agendamento online.
      {
        name: 'Dr. André Siqueira',
        specialty: 'Ortodontia',
        councilCode: 'CRO-SP 40001',
        isActive: false,
      },
    ],
    procedures: [
      {
        name: 'Avaliação odontológica',
        description: 'Primeira consulta com diagnóstico e plano de tratamento',
        durationMinutes: 30,
        priceInCents: 15000,
      },
      {
        name: 'Limpeza dental',
        description: 'Profilaxia e remoção de tártaro',
        durationMinutes: 45,
        priceInCents: 22000,
      },
      { name: 'Restauração', durationMinutes: 60, priceInCents: 35000 },
      {
        name: 'Clareamento dental',
        description: 'Sessão de clareamento em consultório',
        durationMinutes: 90,
        priceInCents: 80000,
      },
      {
        name: 'Avaliação fisioterapêutica',
        durationMinutes: 60,
        priceInCents: 18000,
      },
      {
        name: 'Sessão de fisioterapia',
        durationMinutes: 50,
        priceInCents: 12000,
      },
      {
        name: 'RPG',
        description: 'Reeducação postural global',
        durationMinutes: 60,
        priceInCents: 15000,
      },
      {
        name: 'Limpeza de pele',
        description: 'Higienização profunda com extração',
        durationMinutes: 60,
        priceInCents: 18000,
      },
      { name: 'Toxina botulínica', durationMinutes: 45, priceInCents: 120000 },
      {
        name: 'Preenchimento labial',
        description: 'Ácido hialurônico, 1 ml',
        durationMinutes: 60,
        priceInCents: 150000,
      },
      { name: 'Peeling químico', durationMinutes: 45, priceInCents: 30000 },
      {
        name: 'Consulta nutricional',
        description: 'Anamnese alimentar, bioimpedância e plano alimentar',
        durationMinutes: 60,
        priceInCents: 25000,
      },
      { name: 'Retorno nutricional', durationMinutes: 30, priceInCents: 12000 },
      // Inativo: testa que some da vitrine sem quebrar o histórico.
      {
        name: 'Clareamento a laser (descontinuado)',
        durationMinutes: 60,
        priceInCents: 95000,
        isActive: false,
      },
    ],
    messageTemplates: [
      {
        type: MessageType.APPOINTMENT_REMINDER,
        body: [
          'Oi, {{paciente}}! Aqui é da *{{clinica}}* 😊',
          '',
          'Passando para lembrar do seu horário amanhã:',
          '📅 {{data}} às {{hora}} — {{procedimento}} com {{profissional}}',
          '',
          'Confirma pra gente pelo link? {{link}}',
        ].join('\n'),
      },
    ],
  },
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
      // Quem atende usa PROFESSIONAL, não STAFF: é o papel que abre o
      // prontuário. Serve também para testar que a recepção (Marina) NÃO
      // enxerga o mesmo que ele.
      {
        name: 'Dr. Paulo Nogueira',
        email: 'paulo@clinicasorriso.com.br',
        role: Role.PROFESSIONAL,
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
        faltoso: true,
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
      { name: 'Fábio Torres', phone: '11987650006', faltoso: true },
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
        userEmail: 'admin@clinicasorriso.com.br',
      },
      // Os dois cenários que importam testar: quem herda o expediente da
      // clínica (Helena, sem grade) e quem tem horário restrito (Paulo).
      {
        name: 'Dr. Paulo Nogueira',
        specialty: 'Implantodontia',
        councilCode: 'CRO-SP 51203',
        userEmail: 'paulo@clinicasorriso.com.br',
        procedures: ['Consulta de avaliação', 'Restauração'],
        // Segunda, quarta e sexta de manhã; terça o dia inteiro com almoço.
        schedule: [
          ...windows([1, 2, 3, 5], 480, 720),
          ...windows([2], 780, 1080),
        ],
        timeOff: [{ fromDay: 21, toDay: 26, reason: 'Férias' }],
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
      { name: 'Restauração', durationMinutes: 60, priceInCents: 35000 },
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
      { name: 'Rafael Pinto', phone: '21987650005', faltoso: true },
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
        userEmail: 'admin@esteticabella.com.br',
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
      { name: 'Drenagem linfática', durationMinutes: 50, priceInCents: 12000 },
    ],
  },
];

// ─── Utilitários ──────────────────────────────────────────────────────────

/**
 * PRNG determinístico (mulberry32) semeado pelo subdomínio: a *forma* da
 * agenda (quem falta, quais horários ficam livres) é a mesma a cada reset,
 * o que deixa bug de tela reproduzível. As datas continuam relativas a hoje.
 */
function createRandom(seed: string) {
  let state = 0;
  for (const char of seed) {
    state = Math.imul(state ^ char.charCodeAt(0), 2654435761);
  }

  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    chance: (probability: number) => next() < probability,
    int: (min: number, max: number) =>
      min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T =>
      items[Math.floor(next() * items.length)],
  };
}

type ClinicDay = {
  key: string;
  parts: { year: number; month: number; day: number };
  weekday: number;
};

/**
 * Dia civil da clínica a `offset` dias de hoje.
 *
 * Tudo passa pelo relógio de parede da clínica (`clinic-time.ts`), a mesma
 * regra do backend — com `Date.setHours` o seed só acertaria o expediente
 * numa máquina que por acaso estivesse em America/Sao_Paulo.
 */
function clinicDay(offsetDays: number): ClinicDay {
  const key = clinicDateKey(new Date(Date.now() + offsetDays * DAY_MS));
  const [year, month, day] = key.split('-').map(Number);
  const parts = { year, month, day };

  return {
    key,
    parts,
    weekday: clinicWeekday(fromClinicWallClock(parts, 720)),
  };
}

function at(day: ClinicDay, minutes: number): Date {
  return fromClinicWallClock(day.parts, minutes);
}

function firstName(name: string): string {
  return name.replace(/^(Dra?\.)\s+/, '').split(' ')[0];
}

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
});

const TIME_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
});

// ─── Limpeza ──────────────────────────────────────────────────────────────

async function clean() {
  // Ordem importa: filhos antes dos pais por causa das foreign keys.
  //
  // Prontuário vem primeiro de todos: `clinical_notes`, `anamneses` e
  // `clinical_photos` apontam para paciente/usuário com `RESTRICT`, então
  // apagá-los depois faria o `patient.deleteMany()` abaixo estourar.
  //
  // `clinical_photos` é o mais amarrado dos três — aponta para tenant,
  // paciente, **agendamento** e usuário — e por isso precisa sair antes de
  // todos eles. Esquecê-la aqui é o que quebrava o seed com
  // `clinical_photos_appointment_id_fkey` no `appointment.deleteMany()`.
  await prisma.clinicalPhoto.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.anamnesis.deleteMany();
  // Grade e bloqueio têm `onDelete: Cascade` no profissional, mas apagar
  // explicitamente mantém a ordem legível e não depende do cascade.
  await prisma.professionalSchedule.deleteMany();
  await prisma.professionalTimeOff.deleteMany();
  // `waitlist_entries` aponta para procedimento/profissional/paciente e
  // `inbound_messages` para agendamento/paciente — as duas precisam sair
  // antes deles. Esquecer isso é o que quebrava o seed com
  // `waitlist_entries_procedure_id_fkey`.
  await prisma.waitlistEntry.deleteMany();
  await prisma.inboundMessage.deleteMany();
  await prisma.message.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  // Só depende do tenant, mas precisa sair antes dele.
  await prisma.messageTemplate.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('🧹 Banco limpo (todas as tabelas).');
}

// ─── Cadastros ────────────────────────────────────────────────────────────

async function seedTenant(seedTenant: SeedTenant) {
  const {
    users,
    patients,
    professionals,
    procedures,
    messageTemplates,
    ...tenantData
  } = seedTenant;

  const trialEndsAt = new Date(Date.now() + 30 * DAY_MS);
  const existing = await prisma.tenant.findUnique({
    where: { subdomain: tenantData.subdomain },
    select: { subscriptionStatus: true, trialEndsAt: true },
  });

  // Rodar o seed também "ressuscita" um trial vencido: em desenvolvimento,
  // o `TrialGuard` derrubando o painel no meio do trabalho só atrapalha.
  // Assinatura paga (ACTIVE/PAST_DUE/CANCELED) nunca é tocada.
  const trialRefresh =
    existing &&
    (existing.subscriptionStatus === SubscriptionStatus.TRIALING ||
      existing.subscriptionStatus === SubscriptionStatus.EXPIRED) &&
    existing.trialEndsAt < trialEndsAt
      ? { subscriptionStatus: SubscriptionStatus.TRIALING, trialEndsAt }
      : {};

  /**
   * `FAKE` em todo tenant do seed: os telefones são inventados, e o `.env`
   * de dev pode apontar para a Evolution (WhatsApp de verdade). Um "Reenviar"
   * numa mensagem semeada mandaria texto para o número de um desconhecido.
   * Para testar envio real, troque em Configurações → Mensagens.
   */
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: tenantData.subdomain },
    update: {
      ...tenantData,
      ...trialRefresh,
      messagingProvider: MessagingProvider.FAKE,
    },
    create: {
      ...tenantData,
      trialEndsAt,
      messagingProvider: MessagingProvider.FAKE,
    },
  });

  const usersByEmail = new Map<string, string>();

  for (const user of users) {
    const password = await bcrypt.hash(
      user.password ?? DEV_PASSWORD,
      SALT_ROUNDS,
    );

    const saved = await prisma.user.upsert({
      where: { email: user.email },
      // Senha só é reescrita para quem tem senha própria declarada: é o
      // login que precisa funcionar sempre. Os demais mantêm o que estiver
      // no banco (alguém pode ter trocado pela tela de perfil).
      update: {
        name: user.name,
        role: user.role,
        isActive: user.isActive ?? true,
        ...(user.password ? { password } : {}),
      },
      create: {
        tenantId: tenant.id,
        name: user.name,
        email: user.email,
        password,
        role: user.role,
        isActive: user.isActive ?? true,
      },
    });

    usersByEmail.set(user.email, saved.id);
  }

  for (const { faltoso: _faltoso, deleted, ...patient } of patients) {
    const deletedAt = deleted ? new Date() : null;

    // Sem CPF não há chave natural para upsert — evita duplicar checando antes.
    if (!patient.cpf) {
      const exists = await prisma.patient.findFirst({
        where: { tenantId: tenant.id, name: patient.name },
        select: { id: true },
      });

      if (!exists) {
        await prisma.patient.create({
          data: { ...patient, tenantId: tenant.id, deletedAt },
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
      create: { ...patient, tenantId: tenant.id, deletedAt },
    });
  }

  // Procedimentos antes dos profissionais: o vínculo "quem faz o quê"
  // precisa dos ids.
  for (const { isActive, ...procedure } of procedures) {
    const exists = await prisma.procedure.findFirst({
      where: { tenantId: tenant.id, name: procedure.name },
      select: { id: true },
    });

    if (!exists) {
      await prisma.procedure.create({
        data: { ...procedure, isActive: isActive ?? true, tenantId: tenant.id },
      });
    }
  }

  const procedureIds = new Map(
    (
      await prisma.procedure.findMany({
        where: { tenantId: tenant.id },
        select: { id: true, name: true },
      })
    ).map((procedure) => [procedure.name, procedure.id]),
  );

  for (const professional of professionals) {
    const {
      userEmail,
      procedures: procedureNames = [],
      schedule: _schedule,
      timeOff: _timeOff,
      isActive,
      ...data
    } = professional;

    const userId = userEmail ? (usersByEmail.get(userEmail) ?? null) : null;
    const links = procedureNames.map((name) => {
      const id = procedureIds.get(name);
      if (!id) {
        throw new Error(`Procedimento "${name}" não existe em ${tenant.name}.`);
      }
      return { id };
    });

    const exists = await prisma.professional.findFirst({
      where: { tenantId: tenant.id, name: professional.name },
      select: { id: true },
    });

    if (exists) {
      await prisma.professional.update({
        where: { id: exists.id },
        data: { userId, procedures: { set: links } },
      });
    } else {
      await prisma.professional.create({
        data: {
          ...data,
          isActive: isActive ?? true,
          tenantId: tenant.id,
          userId,
          procedures: { connect: links },
        },
      });
    }
  }

  for (const template of messageTemplates ?? []) {
    await prisma.messageTemplate.upsert({
      where: { tenantId_type: { tenantId: tenant.id, type: template.type } },
      update: { body: template.body, isActive: true },
      create: { ...template, tenantId: tenant.id },
    });
  }

  return tenant;
}

/**
 * Grade semanal e ausências, declaradas em `TENANTS` por profissional.
 *
 * Roda ANTES dos agendamentos: `seedAppointments` consulta a grade para não
 * marcar consulta em dia que o profissional não atende.
 */
async function seedSchedules(
  tenantId: string,
  seedTenant: SeedTenant,
): Promise<number> {
  const alreadySeeded = await prisma.professionalSchedule.count({
    where: { tenantId },
  });

  if (alreadySeeded > 0) {
    return alreadySeeded;
  }

  let created = 0;

  for (const professional of seedTenant.professionals) {
    const saved = await prisma.professional.findFirstOrThrow({
      where: { tenantId, name: professional.name },
      select: { id: true },
    });

    if (professional.schedule?.length) {
      await prisma.professionalSchedule.createMany({
        data: professional.schedule.map((window) => ({
          ...window,
          tenantId,
          professionalId: saved.id,
        })),
      });
      created += professional.schedule.length;
    }

    for (const off of professional.timeOff ?? []) {
      await prisma.professionalTimeOff.create({
        data: {
          tenantId,
          professionalId: saved.id,
          startsAt: at(clinicDay(off.fromDay), 0),
          endsAt: at(clinicDay(off.toDay), 23 * 60 + 59),
          reason: off.reason,
        },
      });
    }
  }

  return created;
}

// ─── Agenda ───────────────────────────────────────────────────────────────

const CANCEL_REASONS = [
  'Paciente remarcou por telefone',
  'Imprevisto no trabalho',
  'Paciente doente',
  'Conflito com outro compromisso',
  'Pediu para cancelar pelo WhatsApp',
];

const APPOINTMENT_NOTES = [
  'Prefere ser lembrado pelo WhatsApp',
  'Trazer exames anteriores',
  'Indicação de outra paciente',
  'Chega sempre uns minutos antes',
  'Pediu horário perto do almoço',
];

/**
 * Agenda de `HISTORY_DAYS` para trás até `FUTURE_DAYS` para frente.
 *
 * Gerada por profissional, faixa a faixa, avançando o cursor pelo fim do
 * atendimento anterior — por construção nunca sobrepõe, então não esbarra na
 * EXCLUDE `appointments_no_overlap_per_professional` do banco. Respeita a
 * mesma regra de disponibilidade do backend (`ProfessionalAvailabilityService`):
 * grade vazia herda o expediente da clínica, ausência bloqueia o dia.
 *
 * O histórico de NO_SHOW é justamente o que o módulo `prediction` consome,
 * e os pacientes `faltoso` nunca confirmam as consultas futuras — juntos,
 * são o que faz a aba "Risco de falta" ter caso alto de verdade.
 */
async function seedAppointments(
  tenantId: string,
  seedTenant: SeedTenant,
): Promise<number> {
  const alreadySeeded = await prisma.appointment.count({ where: { tenantId } });

  if (alreadySeeded > 0) {
    return alreadySeeded;
  }

  const random = createRandom(seedTenant.subdomain);
  const faltosos = new Set(
    seedTenant.patients.filter((p) => p.faltoso).map((p) => p.name),
  );

  const [tenant, patients, professionals, schedules, timeOff] =
    await Promise.all([
      prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: {
          businessDays: true,
          businessHoursStart: true,
          businessHoursEnd: true,
        },
      }),
      prisma.patient.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
      prisma.professional.findMany({
        where: { tenantId, isActive: true, deletedAt: null },
        include: { procedures: { where: { isActive: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.professionalSchedule.findMany({ where: { tenantId } }),
      prisma.professionalTimeOff.findMany({ where: { tenantId } }),
    ]);

  const activeProcedures = await prisma.procedure.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
  });

  if (!patients.length || !professionals.length || !activeProcedures.length) {
    return 0;
  }

  const now = Date.now();
  const data: Prisma.AppointmentCreateManyInput[] = [];
  /** `paciente|dia` — ninguém tem duas consultas no mesmo dia. */
  const busyPatientDays = new Set<string>();

  for (let offset = -HISTORY_DAYS; offset <= FUTURE_DAYS; offset++) {
    const day = clinicDay(offset);

    // Agenda vai esvaziando conforme se afasta de hoje — é assim que uma
    // clínica real se parece: semana que vem cheia, mês que vem quase vazio.
    const occupancy = offset <= 0 ? 0.6 : Math.max(0.12, 0.62 - offset * 0.018);

    for (const professional of professionals) {
      const own = schedules.filter((w) => w.professionalId === professional.id);
      const dayWindows = own.length
        ? own.filter((w) => w.weekday === day.weekday)
        : tenant.businessDays.includes(day.weekday)
          ? [
              {
                startMinutes: tenant.businessHoursStart,
                endMinutes: tenant.businessHoursEnd,
              },
            ]
          : [];

      const dayStart = at(day, 0);
      const dayEnd = at(day, 24 * 60);
      const isOff = timeOff.some(
        (off) =>
          off.professionalId === professional.id &&
          off.startsAt < dayEnd &&
          off.endsAt > dayStart,
      );

      if (isOff) continue;

      // Lista vazia = faz todos, mesma regra do backend.
      const menu = professional.procedures.length
        ? professional.procedures
        : activeProcedures;

      for (const window of dayWindows.sort(
        (a, b) => a.startMinutes - b.startMinutes,
      )) {
        let cursor = window.startMinutes;

        while (cursor < window.endMinutes) {
          if (!random.chance(occupancy)) {
            cursor += 30;
            continue;
          }

          const procedure = random.pick(menu);
          const end = cursor + procedure.durationMinutes;

          if (end > window.endMinutes) break;

          let patient = random.pick(patients);
          for (
            let tries = 0;
            busyPatientDays.has(`${patient.id}|${day.key}`) && tries < 6;
            tries++
          ) {
            patient = random.pick(patients);
          }

          if (busyPatientDays.has(`${patient.id}|${day.key}`)) {
            cursor += 30;
            continue;
          }

          busyPatientDays.add(`${patient.id}|${day.key}`);

          const startsAt = at(day, cursor);
          const endsAt = at(day, end);
          const isPast = startsAt.getTime() < now;
          const faltoso = faltosos.has(patient.name);
          const origin = random.chance(0.2)
            ? AppointmentOrigin.ONLINE
            : AppointmentOrigin.STAFF;

          // Marcada com antecedência: alguns dias antes, nunca no futuro.
          const createdAt = new Date(
            Math.min(
              now - random.int(1, 6) * HOUR_MS,
              startsAt.getTime() - random.int(1, 20) * DAY_MS,
            ),
          );

          let status: AppointmentStatus;

          if (isPast) {
            const roll = random.next();
            status =
              roll < (faltoso ? 0.45 : 0.07)
                ? AppointmentStatus.NO_SHOW
                : roll < (faltoso ? 0.55 : 0.15)
                  ? AppointmentStatus.CANCELLED
                  : AppointmentStatus.COMPLETED;
          } else if (random.chance(0.06)) {
            status = AppointmentStatus.CANCELLED;
          } else {
            const soon = startsAt.getTime() - now < 2 * DAY_MS;
            status =
              !faltoso && random.chance(soon ? 0.6 : 0.2)
                ? AppointmentStatus.CONFIRMED
                : AppointmentStatus.SCHEDULED;
          }

          const confirmed =
            status === AppointmentStatus.CONFIRMED ||
            (status === AppointmentStatus.COMPLETED && random.chance(0.75));

          const confirmedAt = confirmed
            ? new Date(
                Math.max(
                  createdAt.getTime() + HOUR_MS,
                  Math.min(
                    now,
                    startsAt.getTime() - random.int(3, 26) * HOUR_MS,
                  ),
                ),
              )
            : null;

          const cancelledAt =
            status === AppointmentStatus.CANCELLED
              ? new Date(
                  Math.max(
                    createdAt.getTime() + HOUR_MS,
                    Math.min(
                      now,
                      startsAt.getTime() - random.int(2, 48) * HOUR_MS,
                    ),
                  ),
                )
              : null;

          data.push({
            id: randomUUID(),
            tenantId,
            patientId: patient.id,
            professionalId: professional.id,
            procedureId: procedure.id,
            startsAt,
            endsAt,
            status,
            origin,
            priceInCents: procedure.priceInCents,
            notes: random.chance(0.1) ? random.pick(APPOINTMENT_NOTES) : null,
            confirmedAt,
            cancelledAt,
            cancelReason: cancelledAt ? random.pick(CANCEL_REASONS) : null,
            // O link de confirmação só faz sentido para o que ainda vai acontecer.
            confirmationToken:
              !isPast && status !== AppointmentStatus.CANCELLED
                ? randomBytes(24).toString('base64url')
                : null,
            createdAt,
          });

          // Fecha no próximo meio-hora: agenda de verdade não marca às 10:50.
          cursor = Math.ceil(end / 30) * 30;
        }
      }
    }
  }

  await prisma.appointment.createMany({ data });

  return data.length;
}

// ─── Mensagens ────────────────────────────────────────────────────────────

const UNKNOWN_REPLIES = [
  'Qual o endereço da clínica mesmo?',
  'Tem estacionamento aí perto?',
  'Bom dia! Preciso levar algum documento?',
  'Oi, quanto fica o valor da consulta?',
];

const CANCEL_REPLIES = [
  'Não vou conseguir ir, pode remarcar?',
  'Preciso desmarcar, surgiu um imprevisto',
  'Consigo trocar para outro dia?',
];

/**
 * Rastro de WhatsApp coerente com a agenda: aviso de marcação, lembrete D-1
 * (enviado, pendente na fila ou com falha), recibo de confirmação, respostas
 * do paciente e algumas mensagens manuais.
 *
 * ⚠️ **No mês corrente as saídas ficam `DELIVERED`, nunca `SENT`.** A cota
 * do trial (`TRIAL_MESSAGE_QUOTA` = 30) conta só `SENT` no mês: semear
 * centenas de `SENT` esgotaria a franquia e o envio de verdade da clínica
 * passaria a ser recusado. Meses anteriores misturam os dois.
 *
 * Nenhuma linha aqui dispara envio: a fila é o BullMQ, alimentado só pelos
 * use cases. `PENDING` no banco é só o que a tela mostra como "agendada".
 */
async function seedMessages(tenantId: string, subdomain: string) {
  const alreadySeeded = await prisma.message.count({ where: { tenantId } });

  if (alreadySeeded > 0) {
    return { outbound: alreadySeeded, inbound: 0 };
  }

  const random = createRandom(`${subdomain}:messages`);
  const now = Date.now();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { name: true },
  });

  const appointments = await prisma.appointment.findMany({
    where: { tenantId, startsAt: { gte: new Date(now - 45 * DAY_MS) } },
    include: { patient: true, professional: true, procedure: true },
    orderBy: { startsAt: 'asc' },
  });

  const outbound: Prisma.MessageCreateManyInput[] = [];
  const inbound: Prisma.InboundMessageCreateManyInput[] = [];

  const delivered = (sentAt: Date) =>
    sentAt >= monthStart || random.chance(0.6)
      ? MessageStatus.DELIVERED
      : MessageStatus.SENT;

  for (const appointment of appointments) {
    const { patient, professional, procedure } = appointment;
    const toPhone = `55${patient.phone}`;
    const when = `${DATE_FORMAT.format(appointment.startsAt)} às ${TIME_FORMAT.format(appointment.startsAt)}`;
    const base = {
      tenantId,
      appointmentId: appointment.id,
      patientId: patient.id,
      toPhone,
      provider: 'fake',
    };

    // Aviso de marcação — só quando o lembrete D-1 ainda estava longe.
    if (
      appointment.startsAt.getTime() - appointment.createdAt.getTime() >
      DAY_MS
    ) {
      const sentAt = new Date(appointment.createdAt.getTime() + 60_000);
      outbound.push({
        ...base,
        type: MessageType.APPOINTMENT_BOOKED,
        status: delivered(sentAt),
        body: `Olá, ${firstName(patient.name)}! 👋 Sua consulta na *${tenant.name}* foi marcada: 📅 ${when} — ${procedure.name} com ${professional.name}.`,
        providerMessageId: `seed-${randomUUID()}`,
        attempts: 1,
        sentAt,
        createdAt: sentAt,
      });
    }

    const reminderAt = new Date(appointment.startsAt.getTime() - DAY_MS);
    const reminderBody = `Olá, ${firstName(patient.name)}! 👋 Lembrete da sua consulta na *${tenant.name}*: 📅 ${when} — ${procedure.name} com ${professional.name}.`;

    if (appointment.cancelledAt && appointment.cancelledAt < reminderAt) {
      // Cancelou antes do D-1: o lembrete agendado foi descartado.
      outbound.push({
        ...base,
        type: MessageType.APPOINTMENT_REMINDER,
        status: MessageStatus.CANCELLED,
        body: reminderBody,
        scheduledFor: reminderAt,
        createdAt: appointment.createdAt,
      });
    } else if (reminderAt.getTime() > now) {
      outbound.push({
        ...base,
        type: MessageType.APPOINTMENT_REMINDER,
        status: MessageStatus.PENDING,
        body: reminderBody,
        scheduledFor: reminderAt,
        createdAt: appointment.createdAt,
      });
    } else if (random.chance(0.05)) {
      // Falha esgotada: é o que alimenta "ligar para estes pacientes".
      outbound.push({
        ...base,
        type: MessageType.APPOINTMENT_REMINDER,
        status: MessageStatus.FAILED,
        body: reminderBody,
        attempts: 3,
        lastError: random.pick([
          'Número não possui WhatsApp',
          'Timeout ao contatar o provider',
        ]),
        scheduledFor: reminderAt,
        failedAt: new Date(reminderAt.getTime() + 15 * 60_000),
        createdAt: appointment.createdAt,
      });
    } else {
      outbound.push({
        ...base,
        type: MessageType.APPOINTMENT_REMINDER,
        status: delivered(reminderAt),
        body: reminderBody,
        providerMessageId: `seed-${randomUUID()}`,
        attempts: 1,
        scheduledFor: reminderAt,
        sentAt: reminderAt,
        createdAt: appointment.createdAt,
      });
    }

    // Parte das confirmações veio por resposta no WhatsApp (o resto, pelo link).
    if (appointment.confirmedAt && random.chance(0.6)) {
      const repliedAt = new Date(appointment.confirmedAt.getTime() - 60_000);

      inbound.push({
        tenantId,
        patientId: patient.id,
        fromPhone: toPhone,
        body: random.pick([
          'Sim, confirmo!',
          'Confirmado 👍',
          'ok, estarei lá',
          'Sim',
        ]),
        provider: 'fake',
        providerMessageId: `seed-in-${randomUUID()}`,
        sentAt: repliedAt,
        readAt: appointment.confirmedAt,
        intent: ReplyIntent.CONFIRM,
        appointmentId: appointment.id,
        createdAt: repliedAt,
      });

      outbound.push({
        ...base,
        type: MessageType.APPOINTMENT_CONFIRMATION_RECEIPT,
        status: delivered(appointment.confirmedAt),
        body: `Presença confirmada, ${firstName(patient.name)}! Até ${when}. 😉`,
        providerMessageId: `seed-${randomUUID()}`,
        attempts: 1,
        sentAt: appointment.confirmedAt,
        createdAt: appointment.confirmedAt,
      });
    }
  }

  // Caixa de entrada com o que ainda precisa de um humano: pedidos de
  // remarcação e dúvidas que o sistema não soube classificar — não lidas.
  const upcoming = appointments.filter(
    (a) =>
      a.startsAt.getTime() > now && a.status === AppointmentStatus.SCHEDULED,
  );

  for (const appointment of upcoming.slice(0, 3)) {
    const sentAt = new Date(now - random.int(1, 20) * HOUR_MS);
    inbound.push({
      tenantId,
      patientId: appointment.patientId,
      fromPhone: `55${appointment.patient.phone}`,
      body: random.pick(CANCEL_REPLIES),
      provider: 'fake',
      providerMessageId: `seed-in-${randomUUID()}`,
      sentAt,
      intent: ReplyIntent.CANCEL,
      appointmentId: appointment.id,
      createdAt: sentAt,
    });
  }

  for (const appointment of upcoming.slice(3, 6)) {
    const sentAt = new Date(now - random.int(1, 30) * HOUR_MS);
    inbound.push({
      tenantId,
      patientId: appointment.patientId,
      fromPhone: `55${appointment.patient.phone}`,
      body: random.pick(UNKNOWN_REPLIES),
      provider: 'fake',
      providerMessageId: `seed-in-${randomUUID()}`,
      sentAt,
      intent: ReplyIntent.UNKNOWN,
      createdAt: sentAt,
    });
  }

  // Número desconhecido: guardado mesmo sem cadastro (possível paciente novo).
  const strangerAt = new Date(now - 2 * HOUR_MS);
  inbound.push({
    tenantId,
    patientId: null,
    fromPhone: '5511955554444',
    body: 'Olá! Vocês atendem convênio? Gostaria de marcar uma avaliação.',
    provider: 'fake',
    providerMessageId: `seed-in-${randomUUID()}`,
    sentAt: strangerAt,
    intent: ReplyIntent.UNKNOWN,
    createdAt: strangerAt,
  });

  // Respostas manuais da recepção, sem consulta associada.
  const patients = await prisma.patient.findMany({
    where: { tenantId, deletedAt: null },
    take: 2,
    orderBy: { name: 'asc' },
  });

  for (const patient of patients) {
    const sentAt = new Date(now - random.int(2, 72) * HOUR_MS);
    outbound.push({
      tenantId,
      patientId: patient.id,
      toPhone: `55${patient.phone}`,
      type: MessageType.MANUAL,
      status: MessageStatus.DELIVERED,
      body: `Oi, ${firstName(patient.name)}! Seu orçamento ficou pronto, pode passar na recepção quando quiser.`,
      provider: 'fake',
      providerMessageId: `seed-${randomUUID()}`,
      attempts: 1,
      sentAt,
      createdAt: sentAt,
    });
  }

  await prisma.message.createMany({ data: outbound });
  await prisma.inboundMessage.createMany({ data: inbound });

  return { outbound: outbound.length, inbound: inbound.length };
}

// ─── Lista de espera ──────────────────────────────────────────────────────

/**
 * Um exemplo de cada estado da fila. A entrada `SCHEDULED` aponta para um
 * agendamento futuro real do mesmo paciente, como o fluxo de verdade faria.
 */
async function seedWaitlist(
  tenantId: string,
  subdomain: string,
): Promise<number> {
  const alreadySeeded = await prisma.waitlistEntry.count({
    where: { tenantId },
  });

  if (alreadySeeded > 0) {
    return alreadySeeded;
  }

  const random = createRandom(`${subdomain}:waitlist`);
  const now = Date.now();

  const [patients, professionals, procedures] = await Promise.all([
    prisma.patient.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'desc' },
      take: 6,
    }),
    prisma.professional.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      include: { procedures: { where: { isActive: true } } },
    }),
    prisma.procedure.findMany({ where: { tenantId, isActive: true } }),
  ]);

  if (patients.length < 5 || !procedures.length) return 0;

  /** Procedimento que aquele profissional realmente faz. */
  const offer = (professional?: (typeof professionals)[number]) =>
    random.pick(
      professional?.procedures.length ? professional.procedures : procedures,
    );

  const someone = random.pick(professionals);
  const scheduledFrom = await prisma.appointment.findFirst({
    where: {
      tenantId,
      startsAt: { gt: new Date() },
      status: AppointmentStatus.SCHEDULED,
    },
    orderBy: { startsAt: 'asc' },
  });

  const data: Prisma.WaitlistEntryCreateManyInput[] = [
    {
      tenantId,
      patientId: patients[0].id,
      procedureId: offer().id,
      notes: 'Só de manhã',
      createdAt: new Date(now - 9 * DAY_MS),
    },
    {
      tenantId,
      patientId: patients[1].id,
      professionalId: someone.id,
      procedureId: offer(someone).id,
      preferredFrom: new Date(now),
      preferredTo: new Date(now + 14 * DAY_MS),
      notes: `Faz questão de ser atendido por ${someone.name}`,
      createdAt: new Date(now - 5 * DAY_MS),
    },
    {
      tenantId,
      patientId: patients[2].id,
      procedureId: offer().id,
      notes: 'Avisar pelo fixo',
      createdAt: new Date(now - 2 * DAY_MS),
    },
    {
      tenantId,
      patientId: patients[3].id,
      procedureId: offer().id,
      status: WaitlistStatus.OFFERED,
      offeredAt: new Date(now - 3 * HOUR_MS),
      createdAt: new Date(now - 6 * DAY_MS),
    },
    {
      tenantId,
      patientId: patients[4].id,
      procedureId: offer().id,
      status: WaitlistStatus.CANCELLED,
      notes: 'Conseguiu horário em outra clínica',
      createdAt: new Date(now - 12 * DAY_MS),
    },
  ];

  if (scheduledFrom) {
    data.push({
      tenantId,
      patientId: scheduledFrom.patientId,
      professionalId: scheduledFrom.professionalId,
      procedureId: scheduledFrom.procedureId,
      status: WaitlistStatus.SCHEDULED,
      offeredAt: new Date(scheduledFrom.createdAt.getTime() - HOUR_MS),
      appointmentId: scheduledFrom.id,
      createdAt: new Date(scheduledFrom.createdAt.getTime() - 4 * DAY_MS),
    });
  }

  await prisma.waitlistEntry.createMany({ data });

  return data.length;
}

// ─── Prontuário ───────────────────────────────────────────────────────────

const NOTE_TEMPLATES = [
  'Avaliação inicial. Queixa principal registrada, sem intercorrências. Plano de tratamento apresentado e aceito.',
  'Procedimento realizado sem intercorrências. Paciente orientado sobre os cuidados pós-atendimento.',
  'Retorno: boa evolução desde a última sessão. Mantida a conduta.',
  'Paciente relata melhora significativa. Reavaliar em 30 dias.',
  'Sessão concluída conforme planejado. Orientações reforçadas por escrito.',
];

const ANAMNESES = [
  {
    allergies: 'Dipirona',
    medications: 'Losartana 50mg (uso contínuo)',
    conditions: 'Hipertensão controlada',
    observations: null,
  },
  {
    allergies: 'Nega alergias',
    medications: null,
    conditions: null,
    observations: 'Relata ansiedade em procedimentos longos.',
  },
  {
    allergies: 'Látex',
    medications: 'Levotiroxina 75mcg',
    conditions: 'Hipotireoidismo',
    observations: null,
  },
  {
    allergies: 'Penicilina',
    medications: null,
    conditions: 'Diabetes tipo 2, em acompanhamento',
    observations: 'Preferência por atendimento no início da manhã.',
  },
  {
    allergies: 'Nega alergias',
    medications: 'Anticoncepcional oral',
    conditions: null,
    observations: null,
  },
];

/**
 * Ficha de saúde + evolução para os pacientes com atendimento concluído.
 * Cada nota se pendura num atendimento real e é assinada por quem atendeu
 * (o usuário ligado ao profissional) — nunca pela recepção.
 */
async function seedMedicalRecords(tenantId: string): Promise<number> {
  const alreadySeeded = await prisma.clinicalNote.count({
    where: { tenantId },
  });

  if (alreadySeeded > 0) {
    return alreadySeeded;
  }

  const fallbackAuthor = await prisma.user.findFirst({
    where: { tenantId, role: { in: [Role.PROFESSIONAL, Role.ADMIN] } },
    orderBy: { role: 'asc' },
  });

  if (!fallbackAuthor) return 0;

  const patients = await prisma.patient.findMany({
    where: {
      tenantId,
      deletedAt: null,
      appointments: { some: { status: AppointmentStatus.COMPLETED } },
    },
    orderBy: { name: 'asc' },
    take: 15,
    include: {
      appointments: {
        where: { status: AppointmentStatus.COMPLETED },
        orderBy: { startsAt: 'desc' },
        take: 3,
        include: { professional: { select: { userId: true } } },
      },
    },
  });

  let notes = 0;

  for (const [index, patient] of patients.entries()) {
    const author =
      patient.appointments[0]?.professional.userId ?? fallbackAuthor.id;

    await prisma.anamnesis.upsert({
      where: { patientId: patient.id },
      update: {},
      create: {
        tenantId,
        patientId: patient.id,
        ...ANAMNESES[index % ANAMNESES.length],
        updatedByUserId: author,
      },
    });

    // Do mais antigo para o mais recente: a primeira nota é a avaliação.
    const history = [...patient.appointments].reverse();

    await prisma.clinicalNote.createMany({
      data: history.map((appointment, position) => ({
        tenantId,
        patientId: patient.id,
        appointmentId: appointment.id,
        authorUserId: appointment.professional.userId ?? fallbackAuthor.id,
        content:
          NOTE_TEMPLATES[
            position === 0
              ? 0
              : 1 + ((index + position) % (NOTE_TEMPLATES.length - 1))
          ],
        createdAt: appointment.endsAt,
      })),
    });

    notes += history.length;
  }

  return notes;
}

// ─── Planos ───────────────────────────────────────────────────────────────

/**
 * Planos do Stripe (sandbox de teste), revisados em 14/08/2026.
 *
 * **A tabela anterior (R$ 79/149/289/399) tinha dois problemas de negócio:**
 *
 * 1. **Preço em degrau contra um mercado que cobra contínuo.** O Agendiva
 *    cobra base + R$ 29,90 por profissional adicional; nós saltávamos
 *    +R$ 140 do Básico para o Intermediário, exatamente quando a clínica
 *    contrata o terceiro profissional e está comparando. Agora cada faixa
 *    tem `pricePerExtraProfessionalInCents`.
 * 2. **A entrada não tinha nada.** Solo e Básico eram o plano do meio
 *    capado: sem prontuário, sem fotos, sem nada. O concorrente entrega
 *    prontuário e fotos antes/depois já nos R$ 39,90 — e o próprio ROADMAP
 *    registra que isso virou commodity. `hasMedicalRecords` passou a valer
 *    em todos os planos; o que continua pago é o que é **nosso**: risco de
 *    falta, lista de espera, painel de gráficos e IA nas mensagens.
 *
 * **A franquia de mensagem deixou de ser número redondo.** Está ancorada no
 * uso real (~150 atendimentos/profissional/mês × ~2,5 mensagens = ~375 por
 * profissional) com 35% de folga. Isso importa porque **a partir de
 * 01/10/2026 a Meta cobra toda mensagem de utilidade** (~R$ 0,035–0,09
 * cada), inclusive dentro da janela de 24h: no modelo antigo, o "Avançado
 * ilimitado" podia gerar R$ 700/mês de custo num plano de R$ 399. Nenhum
 * plano é ilimitado hoje.
 *
 * ⚠️ Seguem sendo **preços de teste, não validados com cliente real**. O que
 * mudou é que agora eles têm uma conta por trás (custo de mensagem + rateio
 * de infra) em vez de serem hipótese redonda.
 */
const PLANS = [
  {
    key: 'SOLO',
    name: 'Solo',
    priceInCents: 4900,
    maxProfessionals: 1,
    pricePerExtraProfessionalInCents: null,
    maxMessagesPerMonth: 500,
    hasPrediction: false,
    hasAiMessages: false,
    hasWaitlist: false,
    hasDashboard: false,
    // Commodity no mercado: cobrar por prontuário nos deixaria piores que a
    // concorrência justamente onde o cliente compara primeiro.
    hasMedicalRecords: true,
    stripeProductId: 'prod_V4UHD3wrKcCUM7',
    stripePriceId: 'price_1U4LIh64chrm4OaKdKeutDfE',
    stripeExtraProfessionalPriceId: null,
  },
  {
    key: 'ESSENCIAL',
    name: 'Essencial',
    priceInCents: 8900,
    maxProfessionals: 2,
    pricePerExtraProfessionalInCents: 3500,
    maxMessagesPerMonth: 1000,
    hasPrediction: false,
    hasAiMessages: false,
    hasWaitlist: false,
    hasDashboard: false,
    hasMedicalRecords: true,
    stripeProductId: 'prod_V4UH6mhalhGEB7',
    stripePriceId: 'price_1U4LIh64chrm4OaKfpEijb6I',
    stripeExtraProfessionalPriceId: 'price_1U4LIi64chrm4OaKl0NAZ6B8',
  },
  {
    key: 'PROFISSIONAL',
    name: 'Profissional',
    priceInCents: 17900,
    maxProfessionals: 4,
    pricePerExtraProfessionalInCents: 3000,
    maxMessagesPerMonth: 2000,
    // A partir daqui entra o que nenhum concorrente da faixa entrega.
    hasPrediction: true,
    hasAiMessages: true,
    hasWaitlist: true,
    hasDashboard: true,
    hasMedicalRecords: true,
    stripeProductId: 'prod_V4UHlY144qG79S',
    stripePriceId: 'price_1U4LIi64chrm4OaK3LQWKfBC',
    stripeExtraProfessionalPriceId: 'price_1U4LIj64chrm4OaKRcrL7fFM',
  },
  {
    key: 'CLINICA',
    name: 'Clínica',
    priceInCents: 29900,
    maxProfessionals: 8,
    pricePerExtraProfessionalInCents: 2500,
    maxMessagesPerMonth: 4100,
    hasPrediction: true,
    hasAiMessages: true,
    hasWaitlist: true,
    hasDashboard: true,
    hasMedicalRecords: true,
    stripeProductId: 'prod_V4UHog8VhNJkFi',
    stripePriceId: 'price_1U4LIj64chrm4OaKmgEnb2l8',
    stripeExtraProfessionalPriceId: 'price_1U4LIk64chrm4OaKkDHwxLsZ',
  },
];

async function seedPlans() {
  /**
   * ⚠️ **`SOLO` reusa a chave de um plano que já existia com outro preço.**
   *
   * O upsert sobrescreve o registro, então qualquer assinatura que aponte
   * para `SOLO` passa a *dizer* R$ 49 enquanto o Stripe segue cobrando o
   * valor que estava vigente quando ela foi criada (o Stripe congela o
   * `price` no ato da assinatura — mudar o catálogo não altera cobrança
   * existente).
   *
   * Em desenvolvimento isso é inofensivo. **Em produção não**: exige migrar
   * cada assinatura para o `stripePriceId` novo (`subscriptions.update`)
   * antes ou depois de rodar o seed, senão o painel mostra um preço e a
   * fatura chega com outro. Ver ROADMAP → revisão de preço de 14/08/2026.
   */
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { key: plan.key },
      update: plan,
      create: plan,
    });
  }

  /**
   * Aposenta os planos que saíram da tabela (revisão de preço de 14/08/2026:
   * `BASICO`, `INTERMEDIARIO`, `AVANCADO`).
   *
   * **Desativa, não apaga.** `Tenant.planId` aponta para eles: deletar
   * derrubaria a assinatura de quem já contratou, e o histórico de qual
   * plano a clínica tinha some. `isActive: false` some da vitrine
   * (`GET /plans` filtra por ele) e mantém o vínculo de pé até a migração
   * de cada assinatura.
   */
  const aposentados = await prisma.plan.updateMany({
    where: { key: { notIn: PLANS.map((plan) => plan.key) } },
    data: { isActive: false },
  });

  if (aposentados.count > 0) {
    console.log(`   ${aposentados.count} plano(s) antigo(s) desativado(s).`);
  }
}

// ─── Orquestração ─────────────────────────────────────────────────────────

async function full() {
  await seedPlans();

  for (const seedData of TENANTS) {
    const tenant = await seedTenant(seedData);

    // Grade ANTES dos agendamentos: `seedAppointments` consulta a grade para
    // não marcar consulta em dia que o profissional não atende. Na ordem
    // inversa ela leria uma grade ainda vazia e voltaria a gerar dado que o
    // backend recusaria. Mensagens, fila e prontuário vêm depois porque se
    // penduram nos agendamentos.
    const scheduleCount = await seedSchedules(tenant.id, seedData);
    const appointmentCount = await seedAppointments(tenant.id, seedData);
    const messages = await seedMessages(tenant.id, seedData.subdomain);
    const waitlistCount = await seedWaitlist(tenant.id, seedData.subdomain);
    const recordCount = await seedMedicalRecords(tenant.id);

    console.log(
      `✅ ${tenant.name} (${tenant.subdomain}) — ${seedData.users.length} usuários, ` +
        `${seedData.patients.length} pacientes, ${seedData.professionals.length} profissionais, ` +
        `${seedData.procedures.length} procedimentos, ${scheduleCount} faixas de horário, ` +
        `${appointmentCount} agendamentos, ${messages.outbound} mensagens enviadas, ` +
        `${messages.inbound} recebidas, ${waitlistCount} na lista de espera, ${recordCount} evoluções`,
    );
  }

  console.log(`\n🔑 Senha padrão: ${DEV_PASSWORD} (exceto onde indicado)`);
  // Lista um login por papel: testar RBAC (quem vê prontuário, quem não vê)
  // exige saber com qual e-mail entrar em cada caso.
  for (const tenant of TENANTS) {
    console.log(`\n   ${tenant.name}:`);
    for (const role of [Role.ADMIN, Role.PROFESSIONAL, Role.STAFF]) {
      const user = tenant.users.find(
        (candidate) => candidate.role === role && candidate.isActive !== false,
      );
      if (user) {
        const password = user.password ? `  (senha: ${user.password})` : '';
        console.log(`   - ${role.padEnd(12)} ${user.email}${password}`);
      }
    }
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
