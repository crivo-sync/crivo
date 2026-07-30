import { Injectable } from '@nestjs/common';
import { Message, MessageStatus, Prisma } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  CreateMessageData,
  FindManyMessagesParams,
  MarkSentData,
  MessageRepository,
  PaginatedMessages,
} from '../../domain/repository/message.repository';

const WITH_PATIENT = {
  appointment: {
    select: {
      id: true,
      startsAt: true,
      patient: { select: { id: true, name: true, phone: true } },
    },
  },
} satisfies Prisma.MessageInclude;

@Injectable()
export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMessageData): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  findById(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({ where: { id } });
  }

  async findMany({
    tenantId,
    status,
    from,
    to,
    page,
    perPage,
  }: FindManyMessagesParams): Promise<PaginatedMessages> {
    const where: Prisma.MessageWhereInput = {
      tenantId,
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        include: WITH_PATIENT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.message.count({ where }),
    ]);

    return { data, total };
  }

  async markSent(id: string, data: MarkSentData): Promise<void> {
    await this.prisma.message.update({
      where: { id },
      data: {
        status: MessageStatus.SENT,
        sentAt: new Date(),
        provider: data.provider,
        providerMessageId: data.providerMessageId,
        lastError: null,
      },
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.prisma.message.update({
      where: { id },
      data: {
        status: MessageStatus.FAILED,
        failedAt: new Date(),
        lastError: error.slice(0, 500),
      },
    });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.prisma.message.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  countSentInPeriod(tenantId: string, from: Date, to: Date): Promise<number> {
    return this.prisma.message.count({
      where: {
        tenantId,
        status: { in: [MessageStatus.SENT, MessageStatus.DELIVERED] },
        sentAt: { gte: from, lte: to },
      },
    });
  }
}
