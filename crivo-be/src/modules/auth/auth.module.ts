import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { PrismaUserRepository } from './infrastructure/prisma/prisma-user.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { USER_REPOSITORY } from './domain/repository/user.repository';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { TokenService } from './application/services/token.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Number(...) é obrigatório: ConfigService devolve string, e o
          // jsonwebtoken interpreta string sem unidade como milissegundos.
          expiresIn: Number(config.get('JWT_EXPIRES_IN_SECONDS') ?? 900),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    RegisterUseCase,
    LoginUseCase,
    TokenService,
    JwtStrategy,
  ],
})
export class AuthModule {}
