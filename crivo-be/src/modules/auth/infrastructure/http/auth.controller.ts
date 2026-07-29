import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Cria um novo tenant e o usuário admin inicial' })
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
  @ApiOperation({ summary: 'Autentica um usuário e retorna um access token' })
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }
}
