import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  AnamnesisWithAuthor,
  ClinicalNoteWithAuthor,
} from '../../domain/repository/medical-record.repository';

class RecordAuthorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class AnamnesisResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  patientId!: string;

  @ApiPropertyOptional({ nullable: true })
  allergies!: string | null;

  @ApiPropertyOptional({ nullable: true })
  medications!: string | null;

  @ApiPropertyOptional({ nullable: true })
  conditions!: string | null;

  @ApiPropertyOptional({ nullable: true })
  observations!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: RecordAuthorDto,
    description: 'Quem preencheu por último',
  })
  updatedBy!: RecordAuthorDto | null;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(anamnesis: AnamnesisWithAuthor): AnamnesisResponseDto {
    return {
      id: anamnesis.id,
      patientId: anamnesis.patientId,
      allergies: anamnesis.allergies,
      medications: anamnesis.medications,
      conditions: anamnesis.conditions,
      observations: anamnesis.observations,
      updatedBy: anamnesis.updatedByUser,
      updatedAt: anamnesis.updatedAt,
    };
  }
}

export class ClinicalNoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional({ nullable: true })
  appointmentId!: string | null;

  @ApiProperty({ type: RecordAuthorDto })
  author!: RecordAuthorDto;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(note: ClinicalNoteWithAuthor): ClinicalNoteResponseDto {
    return {
      id: note.id,
      content: note.content,
      appointmentId: note.appointmentId,
      author: note.author,
      createdAt: note.createdAt,
    };
  }
}
