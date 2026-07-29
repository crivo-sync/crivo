import { ApiProperty } from '@nestjs/swagger';

export class PatientResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  tenantId!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: '000.000.000-00' })
  cpf: string | undefined;

  @ApiProperty({ example: '(00)00000000' })
  phone!: string;

  @ApiProperty({ example: 'janedoe@email.com' })
  email?: string;
}
