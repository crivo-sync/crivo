import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/repository/user.repository';

export type LoginInput = {
  email: string;
  password: string;
};

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: LoginInput) {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    return { accessToken };
  }
}
