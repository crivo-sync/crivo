import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { SanitizeText } from 'src/shared/transformers/sanitize.transformer';

export class CreateProcedureDto {
  @ApiProperty({ example: 'Limpeza dental' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @SanitizeText()
  name!: string;

  @ApiPropertyOptional({ example: 'Profilaxia e remoção de tártaro' })
  @IsOptional()
  @IsString()
  @SanitizeText()
  description?: string;

  @ApiProperty({ example: 30, description: 'Duração padrão em minutos' })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;

  @ApiProperty({ example: 15000, description: 'Preço em centavos (R$ 150,00)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceInCents!: number;
}
