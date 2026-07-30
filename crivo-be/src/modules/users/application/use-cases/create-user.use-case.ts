import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import {
  USER_MANAGEMENT_REPOSITORY,
  type UserManagementRepository,
} from '../../domain/repository/user.repository';

export type CreateUserInput = {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: Role;
};

const SALT_ROUNDS = 10;

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_MANAGEMENT_REPOSITORY)
    private readonly userRepository: UserManagementRepository,
  ) {}

  async execute(input: CreateUserInput) {
    // email é @unique global, então a colisão pode ser com outro tenant também.
    if (await this.userRepository.existsByEmail(input.email)) {
      throw new ConflictException('Email already in use.');
    }

    return this.userRepository.create({
      ...input,
      password: await bcrypt.hash(input.password, SALT_ROUNDS),
    });
  }
}
