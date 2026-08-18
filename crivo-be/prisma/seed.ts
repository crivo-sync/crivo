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

  // Regras de agendamento da clínica, para o seed não gerar dado que o
  // próprio backend recusaria.
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      businessDays: true,
      businessHoursStart: true,
      businessHoursEnd: true,
    },
  });

  const schedules = await prisma.professionalSchedule.findMany({
    where: { tenantId },
  });

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

  /**
   * O horário cabe na agenda daquele profissional?
   *
   * Grade vazia = herda o expediente da clínica, mesma regra do backend
   * (`ProfessionalAvailabilityService`).
   */
  const fits = (professionalId: string, startsAt: Date, endsAt: Date) => {
    const weekday = startsAt.getDay();
    const start = startsAt.getHours() * 60 + startsAt.getMinutes();
    const end = endsAt.getHours() * 60 + endsAt.getMinutes();

    const own = schedules.filter((w) => w.professionalId === professionalId);

    if (own.length === 0) {
      return (
        tenant.businessDays.includes(weekday) &&
        start >= tenant.businessHoursStart &&
        end <= tenant.businessHoursEnd
      );
    }

    return own.some(
      (w) => w.weekday === weekday && start >= w.startMinutes && end <= w.endMinutes,
    );
  };

  let created = 0;

  for (const [index, [offsetDays, hour, status]] of plan.entries()) {
    const patient = patients[index % patients.length];
    const professional = professionals[index % professionals.length];
    const procedure = procedures[index % procedures.length];

    /**
     * Empurra a data até achar um dia em que o profissional atenda.
     *
     * O `plan` usa offsets em dias corridos, então a data que cai num sábado
     * (ou num dia fora da grade) muda conforme o dia em que o seed roda — e
     * gerava agendamento que o próprio backend recusaria, deixando o Quadro
     * com consulta em cima de faixa "não atende". Sete tentativas cobrem a
     * semana inteira; passou disso, aquele profissional não tem dia válido e
     * a linha é pulada.
     */
    let startsAt = dayAt(offsetDays, hour);
    let endsAt = new Date(startsAt.getTime() + procedure.durationMinutes * 60_000);
    let attempts = 0;

    while (!fits(professional.id, startsAt, endsAt) && attempts < 7) {
      // Mantém o sinal do offset: histórico continua no passado, futuro no
      // futuro — senão um `-30` viraria data futura e o histórico de faltas
      // (matéria-prima da predição) apareceria como consulta a acontecer.
      startsAt = dayAt(offsetDays + (offsetDays < 0 ? -(attempts + 1) : attempts + 1), hour);
      endsAt = new Date(startsAt.getTime() + procedure.durationMinutes * 60_000);
      attempts += 1;
    }

    if (!fits(professional.id, startsAt, endsAt)) {
      console.warn(
        `⏭️  ${professional.name} não tem dia válido para ${hour}h — agendamento pulado.`,
      );
      continue;
    }

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

/**
 * Prontuário de exemplo: ficha de saúde + evolução para os primeiros
 * pacientes. Só faz sentido depois dos agendamentos, porque as notas se
 * penduram nos atendimentos já concluídos.
 */
async function seedMedicalRecords(tenantId: string): Promise<number> {
  const alreadySeeded = await prisma.clinicalNote.count({
    where: { tenantId },
  });

  if (alreadySeeded > 0) {
    return alreadySeeded;
  }

  // Quem assina o registro precisa ter necessidade clínica — nunca a recepção.
  const author = await prisma.user.findFirst({
    where: { tenantId, role: { in: [Role.PROFESSIONAL, Role.ADMIN] } },
    orderBy: { role: 'asc' },
  });

  const patients = await prisma.patient.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    take: 3,
  });

  if (!author || patients.length === 0) {
    return 0;
  }

  let notes = 0;

  for (const [index, patient] of patients.entries()) {
    await prisma.anamnesis.upsert({
      where: { patientId: patient.id },
      update: {},
      create: {
        tenantId,
        patientId: patient.id,
        allergies: index === 0 ? 'Dipirona' : 'Nega alergias',
        medications: index === 0 ? 'Losartana 50mg (uso contínuo)' : null,
        conditions: index === 0 ? 'Hipertensão controlada' : null,
        observations:
          index === 1 ? 'Relata ansiedade em procedimentos longos.' : null,
        updatedByUserId: author.id,
      },
    });

    // Atendimento já concluído para amarrar a evolução — reflete o uso real,
    // em que a nota nasce de uma consulta que aconteceu.
    const pastAppointment = await prisma.appointment.findFirst({
      where: { tenantId, patientId: patient.id, status: 'COMPLETED' },
      orderBy: { startsAt: 'desc' },
    });

    await prisma.clinicalNote.create({
      data: {
        tenantId,
        patientId: patient.id,
        appointmentId: pastAppointment?.id ?? null,
        authorUserId: author.id,
        content:
          index === 0
            ? 'Avaliação inicial. Higiene satisfatória, sem sinais de cárie ativa. Orientado uso de fio dental.'
            : 'Procedimento realizado sem intercorrências. Paciente orientado sobre os cuidados pós-atendimento.',
      },
    });
    notes += 1;
  }

  return notes;
}

/**
 * Grade semanal e um bloqueio de exemplo.
 *
 * De propósito, só o **segundo** profissional de cada clínica recebe grade:
 * assim o seed produz os dois cenários que importam testar — quem tem
 * horário restrito e quem herda o expediente da clínica (grade vazia).
 */
async function seedSchedules(tenantId: string): Promise<number> {
  const alreadySeeded = await prisma.professionalSchedule.count({
    where: { tenantId },
  });

  if (alreadySeeded > 0) {
    return alreadySeeded;
  }

  // Ordena por CRIAÇÃO, não por nome: assim `professionals[1]` é sempre o
  // segundo da lista em `TENANTS`, independente de como as pessoas se
  // chamem. Por nome a ordem dependia do "Dr."/"Dra." do início do texto —
  // qualquer cadastro novo podia mover a grade restrita para outra pessoa
  // sem ninguém mexer nesta função.
  const professionals = await prisma.professional.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  });

  const restricted = professionals[1];
  if (!restricted) return 0;

  // Segunda, quarta e sexta de manhã (08:00–12:00); terça o dia inteiro com
  // intervalo de almoço — duas faixas no mesmo dia, que é o caso que a
  // modelagem "uma linha por faixa" existe para cobrir.
  const windows = [
    { weekday: 1, startMinutes: 480, endMinutes: 720 },
    { weekday: 2, startMinutes: 480, endMinutes: 720 },
    { weekday: 2, startMinutes: 780, endMinutes: 1080 },
    { weekday: 3, startMinutes: 480, endMinutes: 720 },
    { weekday: 5, startMinutes: 480, endMinutes: 720 },
  ];

  await prisma.professionalSchedule.createMany({
    data: windows.map((window) => ({
      ...window,
      tenantId,
      professionalId: restricted.id,
    })),
  });

  // Férias daqui a ~3 semanas: longe o bastante para não colidir com os
  // agendamentos que o seed acabou de criar.
  const vacationStart = dayAt(21, 0);
  const vacationEnd = dayAt(26, 23, 59);

  await prisma.professionalTimeOff.create({
    data: {
      tenantId,
      professionalId: restricted.id,
      startsAt: vacationStart,
      endsAt: vacationEnd,
      reason: 'Férias',
    },
  });

  return windows.length;
}

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

async function full() {
  const hashedPassword = await bcrypt.hash(DEV_PASSWORD, SALT_ROUNDS);

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

  for (const seedTenant of TENANTS) {
    const { users, patients, professionals, procedures, ...tenantData } =
      seedTenant;

    // Upsert por subdomain: rodar o seed duas vezes não duplica nada.
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const tenant = await prisma.tenant.upsert({
      where: { subdomain: tenantData.subdomain },
      update: tenantData,
      create: { ...tenantData, trialEndsAt },
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

    // Grade ANTES dos agendamentos: `seedAppointments` consulta a grade para
    // não marcar consulta em dia que o profissional não atende. Na ordem
    // inversa ela leria uma grade ainda vazia e voltaria a gerar dado que o
    // backend recusaria.
    const scheduleCount = await seedSchedules(tenant.id);
    const appointmentCount = await seedAppointments(tenant.id);
    const recordCount = await seedMedicalRecords(tenant.id);

    console.log(
      `✅ ${tenant.name} (${tenant.subdomain}) — ${users.length} usuários, ${patients.length} pacientes, ${professionals.length} profissionais, ${procedures.length} procedimentos, ${appointmentCount} agendamentos, ${recordCount} evoluções, ${scheduleCount} faixas de horário`,
    );
  }

  console.log(`\n🔑 Senha de todos os usuários: ${DEV_PASSWORD}`);
  // Lista um login por papel: testar RBAC (quem vê prontuário, quem não vê)
  // exige saber com qual e-mail entrar em cada caso.
  for (const tenant of TENANTS) {
    console.log(`\n   ${tenant.name}:`);
    for (const role of [Role.ADMIN, Role.PROFESSIONAL, Role.STAFF]) {
      const user = tenant.users.find(
        (candidate) => candidate.role === role && candidate.isActive !== false,
      );
      if (user) console.log(`   - ${role.padEnd(12)} ${user.email}`);
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
