import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { SanitizeText } from 'src/shared/transformers/sanitize.transformer';

export class CreatePatientDto {
  @ApiProperty({ example: 'Ana Souza' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @SanitizeText()
  name!: string;

  @ApiProperty({
    example: '11987650001',
    description: 'Somente dígitos (DDD + número)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,11}$/, {
    message: 'O telefone deve conter 10 ou 11 dígitos, incluindo o DDD',
  })
  phone!: string;

  @ApiPropertyOptional({
    example: '11122233344',
    description: 'Somente dígitos',
  })
  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'O CPF deve conter exatamente 11 dígitos' })
  @Matches(/^\d{11}$/, { message: 'O CPF deve conter apenas números' })
  cpf?: string;

  @ApiPropertyOptional({ example: 'ana.souza@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
