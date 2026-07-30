import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  CreateUserData,
  UpdateUserData,
  UserManagementRepository,
} from '../../domain/repository/user.repository';

@Injectable()
export class PrismaUserManagementRepository implements UserManagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByTenant(tenantId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdAndTenant(id: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, tenantId } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const found = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return found !== null;
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
