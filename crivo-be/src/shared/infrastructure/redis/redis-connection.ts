import type { ConfigService } from '@nestjs/config';

export type RedisConnectionOptions = {
  host: string;
  port: number;
  password?: string;
  username?: string;
  family?: number;
  tls?: Record<string, never>;
};

/**
 * Conexão do Redis a partir do ambiente, aceitando **os dois formatos**.
 *
 * Plataformas de deploy (Railway, Render, Upstash, Heroku) entregam uma
 * URL única (`REDIS_URL=redis://default:senha@host:6379`), enquanto o
 * `docker-compose` local usa host/porta/senha separados. Sem aceitar a URL,
 * o deploy exigiria quebrar a string à mão em três variáveis — passo manual
 * que ninguém lembra de refazer quando a plataforma rotaciona a senha.
 *
 * `rediss://` (com dois "s") indica TLS, usado por Upstash e pelo Redis
 * gerenciado de várias plataformas; sem habilitar `tls` a conexão é
 * recusada.
 */
export function redisConnection(config: ConfigService): RedisConnectionOptions {
  const url = config.get<string>('REDIS_URL');

  if (url) {
    const parsed = new URL(url);
    const isTls = parsed.protocol === 'rediss:';

    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      // `decodeURIComponent`: senha gerada por plataforma costuma vir com
      // caracteres escapados na URL (`%2F`, `%40`), e mandá-la crua para o
      // Redis resulta em "WRONGPASS" sem pista nenhuma do porquê.
      username: parsed.username
        ? decodeURIComponent(parsed.username)
        : undefined,
      password: parsed.password
        ? decodeURIComponent(parsed.password)
        : undefined,
      ...(isTls ? { tls: {} } : {}),
    };
  }

  return {
    host: config.get<string>('REDIS_HOST') ?? 'localhost',
    port: Number(config.get('REDIS_PORT') ?? 6379),
    password: config.get<string>('REDIS_PASSWORD') || undefined,
  };
}
