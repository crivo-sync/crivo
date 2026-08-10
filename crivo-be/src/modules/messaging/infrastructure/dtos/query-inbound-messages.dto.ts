import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReplyIntent } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class QueryInboundMessagesDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Página atual' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    default: 50,
    minimum: 1,
    maximum: 200,
    description: 'Quantidade de registros por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  perPage: number = 50;

  @ApiPropertyOptional({
    description: 'true = só não lidas, false = só lidas, ausente = todas',
  })
  @IsOptional()
  // Query string chega como texto: sem este transform, `"false"` seria
  // truthy e o filtro faria o oposto do pedido.
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({
    enum: ReplyIntent,
    description: 'Filtra pelo que o sistema entendeu da resposta',
  })
  @IsOptional()
  @IsEnum(ReplyIntent)
  intent?: ReplyIntent;
}
