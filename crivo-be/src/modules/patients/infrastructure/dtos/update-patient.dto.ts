import { PartialType } from '@nestjs/swagger';

import { CreatePatientDto } from './create-patient.dto';

/** Todos os campos de CreatePatientDto, porém opcionais. */
export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
