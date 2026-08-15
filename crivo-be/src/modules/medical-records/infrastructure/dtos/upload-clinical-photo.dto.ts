import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClinicalPhotoKind } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadClinicalPhotoDto {
  @ApiProperty({ enum: ClinicalPhotoKind })
  @IsEnum(ClinicalPhotoKind)
  kind!: ClinicalPhotoKind;

  @ApiPropertyOptional({ example: 'Após 2 sessões' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;
}
