import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { TokenService } from '../../application/services/token.service';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Cadastra uma nova clínica e o seu usuário administrador',
  })
  async register(@Body() dto: RegisterDto) {
    const { tenant, user } = await this.registerUseCase.execute(dto);

    return {
      tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica um usuário e retorna access + refresh token',
  })
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotaciona o refresh token e devolve um novo par de tokens',
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.tokenService.rotate(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga o refresh token informado' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.tokenService.revoke(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiOperation({
    summary: 'Revoga todas as sessões ativas do usuário autenticado',
  })
  async logoutAll(@Tenant('userId') userId: string) {
    await this.tokenService.revokeAllForUser(userId);
  }
}
