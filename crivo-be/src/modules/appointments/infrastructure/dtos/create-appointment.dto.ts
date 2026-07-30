import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { SanitizeText } from 'src/shared/transformers/sanitize.transformer';

export class CreateAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  professionalId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  procedureId!: string;

  @ApiProperty({
    example: '2026-08-15T14:00:00.000Z',
    description: 'Início em ISO 8601 (UTC). A duração vem do procedimento.',
  })
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @ApiPropertyOptional({ example: 'Paciente pediu anestesia.' })
  @IsOptional()
  @IsString()
  @SanitizeText()
  notes?: string;
}
