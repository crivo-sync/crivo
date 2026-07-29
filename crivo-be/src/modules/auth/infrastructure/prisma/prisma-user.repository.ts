import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  CreateUserData,
  UserRepository,
} from '../../domain/repository/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
