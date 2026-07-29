import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  tenantName: string;

  @ApiProperty({ description: 'Identificador único do tenant (ex: clinica-x)' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'subdomain must contain only lowercase letters, numbers and dashes',
  })
  subdomain: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}
