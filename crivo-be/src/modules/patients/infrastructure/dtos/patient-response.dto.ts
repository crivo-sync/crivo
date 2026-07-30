import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Patient } from '@prisma/client';

export class PatientResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  tenantId!: string;

  @ApiProperty({ example: 'Ana Souza' })
  name!: string;

  @ApiProperty({ example: '11987650001' })
  phone!: string;

  @ApiPropertyOptional({ example: '11122233344', nullable: true })
  cpf!: string | null;

  @ApiPropertyOptional({ example: 'ana.souza@email.com', nullable: true })
  email!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(patient: Patient): PatientResponseDto {
    return {
      id: patient.id,
      tenantId: patient.tenantId,
      name: patient.name,
      phone: patient.phone,
      cpf: patient.cpf,
      email: patient.email,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }
}
