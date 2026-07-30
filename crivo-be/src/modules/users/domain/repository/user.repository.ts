import { Role, User } from '@prisma/client';

export type CreateUserData = {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type UpdateUserData = {
  name?: string;
  role?: Role;
  isActive?: boolean;
};

export const USER_MANAGEMENT_REPOSITORY = 'UserManagementRepository';

export type UserManagementRepository = {
  findManyByTenant(tenantId: string): Promise<User[]>;
  findByIdAndTenant(id: string, tenantId: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
};
