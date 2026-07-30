import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from 'src/shared/decorators/roles.decorator';
import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly updateUser: UpdateUserUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista os usuários da clínica' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findAll(@Tenant('tenantId') tenantId: string) {
    const users = await this.listUsers.execute(tenantId);

    return users.map(UserResponseDto.fromEntity);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um usuário na clínica' })
  @ApiOkResponse({ type: UserResponseDto })
  async create(
    @Tenant('tenantId') tenantId: string,
    @Body() dto: CreateUserDto,
  ) {
    const user = await this.createUser.execute({
      tenantId,
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role ?? Role.STAFF,
    });

    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza nome, papel ou status de um usuário' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
    @Tenant('userId') requesterId: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.updateUser.execute({
      targetUserId: id,
      tenantId,
      requesterId,
      ...dto,
    });

    return UserResponseDto.fromEntity(user);
  }
}
