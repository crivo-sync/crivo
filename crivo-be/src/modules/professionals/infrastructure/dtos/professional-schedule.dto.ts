import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SanitizeText } from 'src/shared/transformers/sanitize.transformer';

/** Minutos num dia — 1440 é meia-noite do dia seguinte, o limite superior. */
const MAX_MINUTES_IN_DAY = 1440;

export class ScheduleWindowDto {
  @ApiProperty({ example: 1, description: '0=domingo … 6=sábado' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({
    example: 480,
    description: 'Minutos desde a meia-noite (480 = 08:00)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MINUTES_IN_DAY)
  startMinutes!: number;

  @ApiProperty({
    example: 720,
    description: 'Minutos desde a meia-noite (720 = 12:00)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MINUTES_IN_DAY)
  endMinutes!: number;
}

/**
 * Substitui a grade inteira, não altera faixa por faixa.
 *
 * A tela edita a semana toda de uma vez, então mandar o estado final evita
 * o front ter que calcular quais linhas criar, atualizar e apagar — e evita
 * a grade ficar meio salva se uma dessas chamadas falhasse.
 */
export class ReplaceScheduleDto {
  @ApiProperty({ type: [ScheduleWindowDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ScheduleWindowDto)
  windows!: ScheduleWindowDto[];
}

export class CreateTimeOffDto {
  @ApiProperty({ example: '2026-08-10T12:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @ApiProperty({ example: '2026-08-15T21:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  endsAt!: Date;

  @ApiPropertyOptional({ example: 'Férias' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @SanitizeText()
  reason?: string;
}
