import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

export type ScheduleWindowInput = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

export type ReplaceScheduleInput = {
  professionalId: string;
  tenantId: string;
  windows: ScheduleWindowInput[];
};

/** 480 -> "08:00" */
function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

@Injectable()
export class ReplaceScheduleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /** Só leitura. Array vazio = sem grade, atende o expediente da clínica. */
  async list(professionalId: string, tenantId: string) {
    return this.prisma.professionalSchedule.findMany({
      where: { professionalId, tenantId },
      orderBy: [{ weekday: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  async execute({ professionalId, tenantId, windows }: ReplaceScheduleInput) {
    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    this.assertValidWindows(windows);

    // Troca atômica: apagar e recriar em transação evita a grade ficar vazia
    // se a segunda operação falhar.
    await this.prisma.$transaction([
      this.prisma.professionalSchedule.deleteMany({
        where: { professionalId, tenantId },
      }),
      this.prisma.professionalSchedule.createMany({
        data: windows.map((window) => ({
          ...window,
          professionalId,
          tenantId,
        })),
      }),
    ]);

    return this.prisma.professionalSchedule.findMany({
      where: { professionalId, tenantId },
      orderBy: [{ weekday: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  /**
   * Duas regras: faixa precisa terminar depois de começar, e faixas do mesmo
   * dia não podem se sobrepor. Sobreposição não quebraria o cálculo de
   * disponibilidade (`fitsSchedule` usa `some`), mas indica erro de
   * preenchimento — e uma grade que se contradiz é impossível de conferir
   * depois na tela.
   */
  private assertValidWindows(windows: ScheduleWindowInput[]): void {
    for (const window of windows) {
      if (window.endMinutes <= window.startMinutes) {
        throw new BadRequestException(
          `Em ${WEEKDAY_LABELS[window.weekday]}, o fim (${formatMinutes(window.endMinutes)}) precisa ser depois do início (${formatMinutes(window.startMinutes)}).`,
        );
      }
    }

    const byWeekday = new Map<number, ScheduleWindowInput[]>();
    for (const window of windows) {
      byWeekday.set(window.weekday, [
        ...(byWeekday.get(window.weekday) ?? []),
        window,
      ]);
    }

    for (const [weekday, dayWindows] of byWeekday) {
      const sorted = [...dayWindows].sort(
        (a, b) => a.startMinutes - b.startMinutes,
      );

      for (let index = 1; index < sorted.length; index += 1) {
        // Encostar é válido (08–12 e 12–18); sobrepor não.
        if (sorted[index].startMinutes < sorted[index - 1].endMinutes) {
          throw new BadRequestException(
            `Há faixas sobrepostas em ${WEEKDAY_LABELS[weekday]}: ${formatMinutes(sorted[index - 1].startMinutes)}–${formatMinutes(sorted[index - 1].endMinutes)} e ${formatMinutes(sorted[index].startMinutes)}–${formatMinutes(sorted[index].endMinutes)}.`,
          );
        }
      }
    }
  }
}
