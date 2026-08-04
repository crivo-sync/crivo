import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { SanitizeText } from 'src/shared/transformers/sanitize.transformer';

/**
 * Todos os campos são opcionais: a clínica preenche a ficha aos poucos, e
 * exigir tudo de uma vez faria a recepção inventar dado para conseguir salvar.
 */
export class UpsertAnamnesisDto {
  @ApiPropertyOptional({ example: 'Dipirona, penicilina' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @SanitizeText()
  allergies?: string;

  @ApiPropertyOptional({ example: 'Losartana 50mg (uso contínuo)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @SanitizeText()
  medications?: string;

  @ApiPropertyOptional({ example: 'Hipertensão, diabetes tipo 2' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @SanitizeText()
  conditions?: string;

  @ApiPropertyOptional({ example: 'Relata ansiedade em procedimentos longos.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  @SanitizeText()
  observations?: string;
}
