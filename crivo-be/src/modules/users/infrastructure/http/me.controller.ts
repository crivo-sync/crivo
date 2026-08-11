import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { TrialGuard } from 'src/shared/guards/trial.guard';
import { assertValidImageUpload } from 'src/shared/validation/image-upload';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UpdateMeDto } from '../dtos/update-me.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { UpdateMeUseCase } from '../../application/use-cases/update-me.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { UpdateAvatarUseCase } from '../../application/use-cases/update-avatar.use-case';

/**
 * Endpoints de "minha própria conta" — acessíveis por QUALQUER papel
 * autenticado (sem `@Roles`), diferente de `UserController` (`/users`),
 * que é inteiro `@Roles(ADMIN)` para a gestão de terceiros. Controller
 * separado, não um método dentro de `UserController`, para não depender de
 * sobrescrever `@Roles()` por método numa classe cujo padrão hoje é
 * ADMIN-only — e porque `/users/me` colidiria com `/users/:id`.
 */
@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users/me')
@UseGuards(JwtAuthGuard, TenantContextGuard, TrialGuard)
export class MeController {
  constructor(
    private readonly getMe: GetMeUseCase,
    private readonly updateMe: UpdateMeUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    private readonly updateAvatar: UpdateAvatarUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  @ApiOkResponse({ type: UserResponseDto })
  async me(
    @Tenant('userId') userId: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    const user = await this.getMe.execute(userId, tenantId);

    return UserResponseDto.fromEntity(user);
  }

  @Patch()
  @ApiOperation({ summary: 'Atualiza o próprio nome' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Tenant('userId') userId: string,
    @Tenant('tenantId') tenantId: string,
    @Body() dto: UpdateMeDto,
  ) {
    const user = await this.updateMe.execute({ userId, tenantId, ...dto });

    return UserResponseDto.fromEntity(user);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Troca a própria senha (exige a senha atual)' })
  async changeMyPassword(
    @Tenant('userId') userId: string,
    @Tenant('tenantId') tenantId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.changePassword.execute({ userId, tenantId, ...dto });
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Envia/troca a foto de perfil (JPEG, PNG ou WebP, até 5MB)',
  })
  @ApiOkResponse({ type: UserResponseDto })
  async uploadAvatar(
    @Tenant('userId') userId: string,
    @Tenant('tenantId') tenantId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    assertValidImageUpload(file);

    const user = await this.updateAvatar.execute({
      userId,
      tenantId,
      fileBuffer: file.buffer,
    });

    return UserResponseDto.fromEntity(user);
  }
}
