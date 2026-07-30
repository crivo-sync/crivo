import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SanitizeText } from 'src/shared/transformers/sanitize.transformer';

export class ChangeAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @ApiPropertyOptional({
    example: 'Paciente remarcou por telefone',
    description: 'Usado quando status = CANCELLED.',
  })
  @IsOptional()
  @IsString()
  @SanitizeText()
  cancelReason?: string;
}
