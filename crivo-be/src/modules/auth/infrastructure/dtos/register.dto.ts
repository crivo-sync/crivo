import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

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

  @ApiProperty({ example: 'senha12345', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres' })
  password: string;
}
