import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type ProfessionalWithProcedures } from '../../domain/repository/professional.repository';

export class ProfessionalProcedureDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class ProfessionalResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ example: 'Dra. Helena Prado' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  specialty!: string | null;

  @ApiPropertyOptional({ nullable: true })
  councilCode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({
    type: [ProfessionalProcedureDto],
    description: 'Vazio = realiza todos os procedimentos.',
  })
  procedures!: ProfessionalProcedureDto[];

  static fromEntity(
    professional: ProfessionalWithProcedures,
  ): ProfessionalResponseDto {
    return {
      id: professional.id,
      tenantId: professional.tenantId,
      name: professional.name,
      specialty: professional.specialty,
      councilCode: professional.councilCode,
      phone: professional.phone,
      email: professional.email,
      isActive: professional.isActive,
      createdAt: professional.createdAt,
      procedures: professional.procedures,
    };
  }
}
