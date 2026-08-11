import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { CloudinaryModule } from '../../shared/infrastructure/cloudinary/cloudinary.module';
import { UserController } from './infrastructure/http/user.controller';
import { MeController } from './infrastructure/http/me.controller';
import { PrismaUserManagementRepository } from './infrastructure/prisma/prisma-user-management.repository';
import { USER_MANAGEMENT_REPOSITORY } from './domain/repository/user.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { UpdateMeUseCase } from './application/use-cases/update-me.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { UpdateAvatarUseCase } from './application/use-cases/update-avatar.use-case';
import { GuardsModule } from '../../shared/guards/guards.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, GuardsModule],
  // MeController (`/users/me`) precisa ser registrado ANTES de UserController
  // (`/users/:id`): o Nest resolve rotas na ordem de registro dos
  // controllers, e `:id` casaria com o literal "me" primeiro se viesse antes.
  controllers: [MeController, UserController],
  providers: [
    {
      provide: USER_MANAGEMENT_REPOSITORY,
      useClass: PrismaUserManagementRepository,
    },
    CreateUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    GetMeUseCase,
    UpdateMeUseCase,
    ChangePasswordUseCase,
    UpdateAvatarUseCase,
  ],
})
export class UsersModule {}
