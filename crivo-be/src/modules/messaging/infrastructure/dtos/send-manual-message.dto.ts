import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendManualMessageDto {
  @ApiProperty({ example: 'Olá! Confirmando que sua consulta foi remarcada.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
