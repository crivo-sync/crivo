import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SanitizeText } from 'src/shared/transformers/sanitize.transformer';

export class CreateClinicalNoteDto {
  @ApiProperty({
    example: 'Realizada profilaxia. Paciente relatou sensibilidade no 26.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(10000)
  @SanitizeText()
  content!: string;

  @ApiPropertyOptional({
    description:
      'Atendimento a que a evolução se refere. Opcional: registro pode ser feito fora de uma consulta agendada.',
  })
  @IsOptional()
  @IsUUID('4')
  appointmentId?: string;
}
