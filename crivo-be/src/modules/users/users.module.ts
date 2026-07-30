import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { UserController } from './infrastructure/http/user.controller';
import { PrismaUserManagementRepository } from './infrastructure/prisma/prisma-user-management.repository';
import { USER_MANAGEMENT_REPOSITORY } from './domain/repository/user.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    {
      provide: USER_MANAGEMENT_REPOSITORY,
      useClass: PrismaUserManagementRepository,
    },
    CreateUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
  ],
})
export class UsersModule {}
