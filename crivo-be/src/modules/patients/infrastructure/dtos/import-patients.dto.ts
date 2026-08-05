import { ApiProperty } from '@nestjs/swagger';

import type { ImportPatientsResult } from '../../application/use-cases/import-patients.use-case';

export class ImportRowIssueDto {
  @ApiProperty({
    example: 14,
    description: 'Linha no arquivo, contando o cabeçalho',
  })
  line!: number;

  @ApiProperty({ example: 'Ana Souza', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'Já existe um paciente com este CPF.' })
  message!: string;
}

export class ImportPreviewRowDto {
  @ApiProperty({ example: 'Ana Souza' })
  name!: string;

  @ApiProperty({ example: '11987650001' })
  phone!: string;

  @ApiProperty({ example: '11122233344', nullable: true })
  cpf!: string | null;

  @ApiProperty({ example: 'ana@email.com', nullable: true })
  email!: string | null;
}

export class ImportPatientsResponseDto {
  @ApiProperty({
    example: true,
    description: 'true = apenas simulação, nada foi gravado',
  })
  dryRun!: boolean;

  @ApiProperty({ example: 120, description: 'Linhas de dados no arquivo' })
  totalRows!: number;

  @ApiProperty({
    example: 108,
    description: 'Pacientes criados — ou que seriam criados, se dryRun',
  })
  created!: number;

  @ApiProperty({ type: [ImportPreviewRowDto] })
  preview!: ImportPreviewRowDto[];

  @ApiProperty({ type: [ImportRowIssueDto] })
  duplicates!: ImportRowIssueDto[];

  @ApiProperty({ type: [ImportRowIssueDto] })
  errors!: ImportRowIssueDto[];

  static fromResult(result: ImportPatientsResult): ImportPatientsResponseDto {
    return result;
  }
}
