import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Clínica Sorriso', description: 'Nome da clínica' })
  @IsString()
  @MinLength(2, { message: 'O nome da clínica deve ter ao menos 2 caracteres' })
  tenantName: string;

  @ApiProperty({
    example: 'clinica-sorriso',
    description:
      'Identificador único da clínica, usado no endereço de acesso (ex: clinica-sorriso.crivo.com.br)',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'O identificador deve conter apenas letras minúsculas, números e hífens',
  })
  subdomain: string;

  @ApiProperty({
    example: 'Helena Prado',
    description: 'Nome do usuário administrador',
  })
  @IsString()
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres' })
  name: string;

  @ApiProperty({ example: 'admin@clinicasorriso.com.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string;

  @ApiProperty({
    example: '11987654321',
    description:
      'WhatsApp da clínica, só dígitos (DDD + número). É o contato que o Crivo Sync usa para falar com a clínica.',
  })
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'Informe um WhatsApp válido com DDD (10 ou 11 dígitos)',
  })
  phone: string;

  @ApiProperty({ example: 'senha12345', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres' })
  password: string;

  /**
   * Plano pretendido (`Plan.key`), vindo da tabela de preços do site.
   * **Não cobra nada** — o trial continua 14 dias sem cartão; o plano só
   * define o teto que vale durante o teste, para a clínica não montar uma
   * equipe que não cabe no que ela vai assinar.
   */
  @ApiPropertyOptional({
    example: 'ESSENCIAL',
    description:
      'Plano pretendido, para o limite já valer no teste. Não gera cobrança.',
  })
  @IsOptional()
  @IsString()
  planKey?: string;
}
