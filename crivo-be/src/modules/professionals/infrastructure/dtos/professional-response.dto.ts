import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type ProfessionalWithProcedures } from '../../domain/repository/professional.repository';

export class ProfessionalProcedureDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class ProfessionalScheduleWindowDto {
  @ApiProperty({ example: 3, description: '0=domingo … 6=sábado' })
  weekday!: number;

  @ApiProperty({ example: 480, description: 'Minutos desde a meia-noite' })
  startMinutes!: number;

  @ApiProperty({ example: 720 })
  endMinutes!: number;
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

  @ApiProperty({
    type: [ProfessionalScheduleWindowDto],
    description:
      'Grade semanal. Vazio = atende o expediente inteiro da clínica.',
  })
  schedules!: ProfessionalScheduleWindowDto[];

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
      // `?? []` porque `create`/`update` devolvem a entidade recém-gravada,
      // cuja grade ainda não existe — e um `undefined` aqui sumiria do JSON,
      // fazendo o cliente ler "sem grade" como se fosse fato confirmado.
      schedules: professional.schedules ?? [],
    };
  }
}
