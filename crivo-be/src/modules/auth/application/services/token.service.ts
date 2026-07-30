import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

/**
 * O refresh token é opaco (bytes aleatórios) e só o hash é persistido —
 * vazar a tabela não permite reutilizar as sessões.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private get refreshTtlSeconds(): number {
    // ConfigService devolve string; converter aqui evita depender de coerção.
    return Number(
      this.config.get('REFRESH_TOKEN_EXPIRES_IN_SECONDS') ?? 2592000,
    );
  }

  async issuePair(
    user: Pick<User, 'id' | 'tenantId' | 'role'>,
  ): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    const refreshToken = randomBytes(48).toString('hex');

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Valida o refresh token, revoga o atual e emite um novo par (rotação).
   */
  async rotate(refreshToken: string): Promise<TokenPair> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('User is inactive.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issuePair(stored.user);
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoga todas as sessões ativas do usuário (logout em todos os dispositivos). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
