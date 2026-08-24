import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

import { parseClinicDateKey } from 'src/shared/clinic-time';

/**
 * `new Date('2026-08-05')` é interpretado como meia-noite **UTC**, que em
 * Brasília (UTC-3) cai em 04/08 às 21:00 — o dia inteiro escorregava para o
 * anterior e a agenda vinha errada. Para "YYYY-MM-DD" montamos a meia-noite
 * do fuso da clínica (`clinic-time.ts`) explicitamente — nunca o fuso do
 * processo Node, que em produção (container) é UTC, não o fuso da clínica.
 */
function parseLocalDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;

  const parsed = parseClinicDateKey(value);
  if (parsed) return parsed;

  // Deixa o `@IsDate()` reprovar entradas inválidas com a mensagem padrão,
  // em vez de propagar um `Invalid Date` adiante.
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? undefined : fallback;
}

export class QueryAvailabilityDto {
  @ApiProperty()
  @IsUUID()
  professionalId!: string;

  @ApiProperty({ description: 'Define a duração de cada horário oferecido.' })
  @IsUUID()
  procedureId!: string;

  @ApiProperty({
    example: '2026-08-10',
    description: 'Dia consultado — a hora é ignorada.',
  })
  @Transform(({ value }) => parseLocalDate(value))
  @IsDate()
  date!: Date;

  @ApiPropertyOptional({
    description:
      'Ao reagendar, ignora o próprio agendamento para o horário atual ' +
      'não aparecer como ocupado por ele mesmo.',
  })
  @IsOptional()
  @IsUUID()
  excludeAppointmentId?: string;
}
