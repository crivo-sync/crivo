import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { SanitizeText } from 'src/shared/transformers/sanitize.transformer';

export class CreateProfessionalDto {
  @ApiProperty({ example: 'Dra. Helena Prado' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @SanitizeText()
  name!: string;

  @ApiPropertyOptional({ example: 'Ortodontia' })
  @IsOptional()
  @IsString()
  @SanitizeText()
  specialty?: string;

  @ApiPropertyOptional({ example: 'CRO-SP 12345' })
  @IsOptional()
  @IsString()
  @SanitizeText()
  councilCode?: string;

  @ApiPropertyOptional({ example: '11987654321' })
  @IsOptional()
  @Matches(/^\d{10,11}$/, {
    message: 'O telefone deve conter 10 ou 11 dígitos, incluindo o DDD',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'helena@clinica.com.br' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
