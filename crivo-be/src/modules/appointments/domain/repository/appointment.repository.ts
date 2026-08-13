import {
  Appointment,
  AppointmentStatus,
  AppointmentOrigin,
} from '@prisma/client';

export type CreateAppointmentData = {
  tenantId: string;
  patientId: string;
  professionalId: string;
  procedureId: string;
  startsAt: Date;
  endsAt: Date;
  priceInCents: number;
  notes?: string | null;
  origin?: AppointmentOrigin;
};

export type UpdateAppointmentData = {
  startsAt?: Date;
  endsAt?: Date;
  professionalId?: string;
  procedureId?: string;
  priceInCents?: number;
  notes?: string | null;
  status?: AppointmentStatus;
  confirmedAt?: Date | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
};

export type FindManyAppointmentsParams = {
  tenantId: string;
  /** Janela de tempo — a agenda é sempre consultada por período. */
  from?: Date;
  to?: Date;
  professionalId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  page: number;
  perPage: number;
};

/** Agendamento com os dados de exibição da agenda já carregados. */
export type AppointmentWithRelations = Appointment & {
  patient: { id: string; name: string; phone: string };
  professional: { id: string; name: string };
  procedure: { id: string; name: string; durationMinutes: number };
};

export type PaginatedAppointments = {
  data: AppointmentWithRelations[];
  total: number;
};

export type FindOverlappingParams = {
  tenantId: string;
  professionalId: string;
  startsAt: Date;
  endsAt: Date;
  /** Ignora o próprio agendamento ao reagendar. */
  excludeAppointmentId?: string;
};

export const APPOINTMENT_REPOSITORY = 'AppointmentRepository';

export type AppointmentRepository = {
  findMany(params: FindManyAppointmentsParams): Promise<PaginatedAppointments>;
  /**
   * Quantos agendamentos foram criados depois de um instante.
   *
   * Independente de paginação e de filtro de propósito: a lista é ordenada
   * por data de atendimento, então um agendamento marcado para daqui a dias
   * cai numa página posterior e o aviso de "chegou alguém" nunca apareceria
   * para quem está na página 1 — que é o caso comum.
   */
  countCreatedAfter(tenantId: string, since: Date): Promise<number>;
  findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<AppointmentWithRelations | null>;
  findOverlapping(params: FindOverlappingParams): Promise<Appointment | null>;
  create(data: CreateAppointmentData): Promise<Appointment>;
  update(id: string, data: UpdateAppointmentData): Promise<Appointment>;
};
