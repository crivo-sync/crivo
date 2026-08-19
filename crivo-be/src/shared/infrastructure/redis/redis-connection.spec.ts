import type { ConfigService } from '@nestjs/config';

import { redisConnection } from './redis-connection';

/** `ConfigService` mínimo: só o `get` que o helper usa. */
function makeConfig(env: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => env[key] } as unknown as ConfigService;
}

/**
 * O deploy quebra de formas silenciosas quando isto erra: fila parada sem
 * erro visível na tela, ou "WRONGPASS" sem pista da causa.
 */
describe('redisConnection', () => {
  it('usa host/porta/senha separados quando não há REDIS_URL (docker local)', () => {
    const config = makeConfig({
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '',
    });

    expect(redisConnection(config)).toEqual({
      host: 'localhost',
      port: 6379,
      password: undefined,
    });
  });

  it('cai no default quando não há nada configurado', () => {
    expect(redisConnection(makeConfig({}))).toEqual({
      host: 'localhost',
      port: 6379,
      password: undefined,
    });
  });

  /** Formato que Railway/Render/Heroku entregam. */
  it('quebra a REDIS_URL em host, porta, usuário e senha', () => {
    const config = makeConfig({
      REDIS_URL: 'redis://default:s3nh4@redis.railway.internal:6380',
    });

    expect(redisConnection(config)).toEqual({
      host: 'redis.railway.internal',
      port: 6380,
      username: 'default',
      password: 's3nh4',
    });
  });

  /**
   * Senha gerada por plataforma costuma vir escapada na URL. Mandá-la crua
   * para o Redis dá "WRONGPASS" sem indicar o motivo.
   */
  it('decodifica caracteres escapados na senha', () => {
    const config = makeConfig({
      REDIS_URL: 'redis://default:a%2Fb%40c@host:6379',
    });

    expect(redisConnection(config)).toMatchObject({ password: 'a/b@c' });
  });

  /** `rediss://` = TLS; sem habilitar, a conexão é recusada. */
  it('habilita TLS para rediss://', () => {
    const config = makeConfig({
      REDIS_URL: 'rediss://default:senha@upstash.io:6379',
    });

    expect(redisConnection(config)).toMatchObject({ tls: {} });
  });

  it('não habilita TLS para redis:// comum', () => {
    const config = makeConfig({ REDIS_URL: 'redis://host:6379' });

    expect(redisConnection(config)).not.toHaveProperty('tls');
  });

  /** URL tem precedência: é o que a plataforma injeta no deploy. */
  it('prefere REDIS_URL quando as duas formas existem', () => {
    const config = makeConfig({
      REDIS_URL: 'redis://default:nova@remoto:6380',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
    });

    expect(redisConnection(config)).toMatchObject({
      host: 'remoto',
      port: 6380,
    });
  });

  it('assume 6379 quando a URL não traz porta', () => {
    const config = makeConfig({ REDIS_URL: 'redis://host' });

    expect(redisConnection(config)).toMatchObject({ port: 6379 });
  });
});
