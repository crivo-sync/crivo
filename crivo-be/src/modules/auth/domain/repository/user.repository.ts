import { User } from '@prisma/client';

export type CreateUserData = {
  tenantId: string;
  name: string;
  email: string;
  password: string;
};

export const USER_REPOSITORY = 'UserRepository';

export type UserRepository = {
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
};
