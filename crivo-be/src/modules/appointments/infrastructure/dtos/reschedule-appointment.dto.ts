import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { SanitizeText } from 'src/shared/transformers/sanitize.transformer';

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-08-16T09:30:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Informe para trocar o profissional junto com o horário.',
  })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @SanitizeText()
  notes?: string;
}
