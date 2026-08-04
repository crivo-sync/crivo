import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

/**
 * `new Date('2026-08-05')` é interpretado como meia-noite **UTC**, que em
 * Brasília (UTC-3) cai em 04/08 às 21:00 — o dia inteiro escorregava para o
 * anterior e a agenda vinha errada. Para "YYYY-MM-DD" montamos a data em
 * horário **local**, que é o fuso em que a clínica raciocina.
 */
function parseLocalDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    // Deixa o `@IsDate()` reprovar entradas inválidas com a mensagem padrão,
    // em vez de propagar um `Invalid Date` adiante.
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
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
