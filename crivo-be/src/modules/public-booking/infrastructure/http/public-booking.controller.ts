import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { GetAvailabilityUseCase } from 'src/modules/appointments/application/use-cases/get-availability.use-case';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { BookOnlineUseCase } from '../../application/book-online.use-case';

export class BookOnlineDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  patientName!: string;

  @ApiProperty({ example: '11987654321' })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  patientPhone!: string;

  @ApiProperty()
  @IsUUID()
  professionalId!: string;

  @ApiProperty()
  @IsUUID()
  procedureId!: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/**
 * Página pública de agendamento — o paciente marca sozinho, sem login.
 *
 * **Sem guard de propósito.** A clínica é determinada pelo subdomínio da
 * URL, e cada id recebido é conferido contra ela dentro do use case. Só
 * expõe o necessário para escolher horário: nome do profissional e do
 * procedimento com preço. Nada de telefone de paciente, agenda de outra
 * pessoa ou qualquer dado clínico.
 */
@ApiTags('Agendamento online (público)')
@Controller('public/:subdomain')
export class PublicBookingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookOnline: BookOnlineUseCase,
    private readonly getAvailability: GetAvailabilityUseCase,
  ) {}

  @Get('booking-options')
  @ApiOperation({
    summary: 'Profissionais e procedimentos que o paciente pode escolher',
  })
  async options(@Param('subdomain') subdomain: string) {
    const tenant = await this.findTenant(subdomain);

    const [professionals, procedures] = await Promise.all([
      this.prisma.professional.findMany({
        where: { tenantId: tenant.id, isActive: true, deletedAt: null },
        // Só o que serve para escolher. `phone`, `email` e `councilCode`
        // ficam de fora: é página aberta na internet.
        select: {
          id: true,
          name: true,
          specialty: true,
          procedures: { select: { id: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.procedure.findMany({
        where: { tenantId: tenant.id, isActive: true },
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          priceInCents: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      clinic: {
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        phone: tenant.phone,
        address: tenant.address,
      },
      professionals,
      procedures,
    };
  }

  @Get('availability')
  @ApiOperation({ summary: 'Horários livres para o paciente escolher' })
  async availability(
    @Param('subdomain') subdomain: string,
    @Query('professionalId') professionalId: string,
    @Query('procedureId') procedureId: string,
    @Query('date') date: string,
  ) {
    const tenant = await this.findTenant(subdomain);

    if (!professionalId || !procedureId || !date) {
      throw new BadRequestException(
        'Informe profissional, procedimento e data.',
      );
    }

    // Mesma regra do painel: expediente, grade do profissional, bloqueios e
    // duração do procedimento. Uma segunda implementação aqui divergiria.
    return this.getAvailability.execute({
      tenantId: tenant.id,
      professionalId,
      procedureId,
      date: parseLocalDate(date),
    });
  }

  @Post('bookings')
  @ApiOperation({ summary: 'O paciente marca a consulta' })
  async book(
    @Param('subdomain') subdomain: string,
    @Body() dto: BookOnlineDto,
  ) {
    const { appointment, clinicName } = await this.bookOnline.execute({
      subdomain,
      ...dto,
    });

    // Devolve só o que o paciente precisa ver na confirmação — nada de id
    // interno de paciente ou dado de outro registro.
    return {
      id: appointment.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      clinicName,
    };
  }

  private async findTenant(subdomain: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { subdomain, isActive: true },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        phone: true,
        address: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Clínica não encontrada.');
    }

    return tenant;
  }
}

/**
 * `YYYY-MM-DD` em hora **local**, não UTC.
 *
 * `new Date('2026-08-20')` é meia-noite UTC, que em Brasília cai no dia 19 às
 * 21h — a agenda inteira escorregaria um dia. Mesma armadilha já documentada
 * no DTO do painel.
 */
function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    throw new BadRequestException('Data inválida.');
  }

  return new Date(year, month - 1, day);
}
