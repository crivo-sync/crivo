import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Procedure } from '@prisma/client';

export class ProcedureResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ example: 'Limpeza dental' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: 30 })
  durationMinutes!: number;

  @ApiProperty({ example: 15000, description: 'Preço em centavos' })
  priceInCents!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(procedure: Procedure): ProcedureResponseDto {
    return {
      id: procedure.id,
      tenantId: procedure.tenantId,
      name: procedure.name,
      description: procedure.description,
      durationMinutes: procedure.durationMinutes,
      priceInCents: procedure.priceInCents,
      isActive: procedure.isActive,
      createdAt: procedure.createdAt,
    };
  }
}
