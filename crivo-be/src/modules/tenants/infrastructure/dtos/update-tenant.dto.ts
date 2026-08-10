import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessagingProvider } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.exemplo.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#4F46E5' })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#22D3EE' })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description:
      'Reescreve as mensagens de WhatsApp com IA (DeepSeek), com tom mais natural. ' +
      'Se a IA falhar ou omitir algum dado, o envio cai automaticamente para o texto padrão.',
  })
  @IsOptional()
  @IsBoolean()
  aiMessagesEnabled?: boolean;

  @ApiPropertyOptional({
    enum: MessagingProvider,
    description:
      'Por onde o WhatsApp desta clínica sai. As credenciais ficam em variáveis ' +
      'de ambiente do servidor — aqui escolhe-se apenas o caminho. ' +
      'Ausente = usa o padrão do servidor (MESSAGING_PROVIDER).',
  })
  @IsOptional()
  @IsEnum(MessagingProvider)
  messagingProvider?: MessagingProvider;

  @ApiPropertyOptional({
    example: 480,
    description:
      'Abertura da clínica em minutos desde a meia-noite (480 = 08:00).',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  businessHoursStart?: number;

  @ApiPropertyOptional({
    example: 1080,
    description:
      'Fechamento da clínica em minutos desde a meia-noite (1080 = 18:00).',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  businessHoursEnd?: number;

  @ApiPropertyOptional({
    example: [1, 2, 3, 4, 5],
    description:
      'Dias de atendimento no padrão getDay(): 0=domingo … 6=sábado.',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  businessDays?: number[];
}
