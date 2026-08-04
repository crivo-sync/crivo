import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

const WEEKDAY_LABELS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

export type BusinessHoursConfig = {
  businessHoursStart: number;
  businessHoursEnd: number;
  businessDays: number[];
};

/** 480 -> "08:00". Espelha o formato que a recepção vê na tela. */
function formatMinutes(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

@Injectable()
export class BusinessHoursService {
  constructor(private readonly prisma: PrismaService) {}

  /** Expediente configurado da clínica, ou `null` se o tenant sumiu. */
  async getConfig(tenantId: string): Promise<BusinessHoursConfig | null> {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        businessHoursStart: true,
        businessHoursEnd: true,
        businessDays: true,
      },
    });
  }

  /**
   * Recusa agendamento fora do expediente da clínica. O atendimento precisa
   * CABER inteiro na janela: um procedimento de 90min às 17:00 com fechamento
   * às 18:00 é rejeitado, porque terminaria 18:30 — validar só o início
   * deixaria passar exatamente o caso que motivou esta regra.
   *
   * `startsAt`/`endsAt` chegam como `Date` do servidor, e a comparação usa
   * hora local (`getHours`) de propósito: o expediente é do relógio de parede
   * da clínica, não UTC.
   */
  async assertWithinBusinessHours(
    tenantId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<void> {
    const tenant = await this.getConfig(tenantId);

    if (!tenant) return;

    const weekday = startsAt.getDay();
    if (!tenant.businessDays.includes(weekday)) {
      const openDays = tenant.businessDays
        .slice()
        .sort((a, b) => a - b)
        .map((day) => WEEKDAY_LABELS[day])
        .join(', ');

      throw new BadRequestException(
        `A clínica não atende ${WEEKDAY_LABELS[weekday]}. Dias de atendimento: ${openDays}.`,
      );
    }

    const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
    if (startMinutes < tenant.businessHoursStart) {
      throw new BadRequestException(
        `A clínica abre às ${formatMinutes(tenant.businessHoursStart)}.`,
      );
    }

    // O fim é comparado no mesmo dia do início: um atendimento que atravessa a
    // meia-noite já estouraria o fechamento de qualquer expediente normal.
    const endMinutes =
      endsAt.getHours() * 60 +
      endsAt.getMinutes() +
      (endsAt.getDate() !== startsAt.getDate() ? 24 * 60 : 0);

    if (endMinutes > tenant.businessHoursEnd) {
      throw new BadRequestException(
        `O atendimento terminaria às ${formatMinutes(endMinutes)}, depois do fechamento (${formatMinutes(tenant.businessHoursEnd)}). Escolha um horário mais cedo ou um procedimento mais curto.`,
      );
    }
  }
}
