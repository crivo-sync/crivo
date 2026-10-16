import { existsSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// `.env` é o ambiente de desenvolvimento. Com NODE_ENV=production o CLI passa
// a ler `.env.production`, que é como rodamos migration no Supabase a partir da
// máquina local:
//   NODE_ENV=production npm run prisma:deploy
// O arquivo NÃO existe no Render/Railway (é ignorado pelo git e as variáveis
// vêm do painel), por isso a leitura é condicional — sem o `existsSync` o
// `start:migrate:prod` quebraria no deploy com ENOENT.
loadEnv();
if (process.env['NODE_ENV'] === 'production' && existsSync('.env.production')) {
  loadEnv({ path: '.env.production', override: true });
}

// O CLI (migrate, seed, studio) usa DIRECT_URL quando existe, para não passar
// pelo PgBouncer; a aplicação em si lê DATABASE_URL (prisma.service.ts).
const mainUrl =
  process.env['DIRECT_URL'] ??
  process.env['DATABASE_URL'] ??
  'postgresql://admin:admin@localhost:5440/crivo?schema=public';

// Só `migrate dev`/`migrate diff` usam isto: o Prisma apaga e recria esse banco
// para comparar o schema. Precisa ser um banco VAZIO e separado do de
// desenvolvimento — o 5440 é o Postgres do docker-compose, o mesmo que o
// `.env` usa.
const shadowUrl =
  process.env['SHADOW_DATABASE_URL'] ??
  'postgresql://admin:admin@localhost:5440/crivo_shadow?schema=public';

/** Host+porta+banco, sem usuário/senha — para comparar dois destinos. */
function target(raw: string) {
  try {
    const url = new URL(raw);
    return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
  } catch {
    return raw;
  }
}

// Origem do erro "The shadow database you configured appears to be the same as
// the main database": a SHADOW_DATABASE_URL ficou igual ao banco de destino
// (típico de copiar o DIRECT_URL para ela). O Prisma só valida isso depois de
// conectar, e ali morre **qualquer** comando de migration — inclusive o
// `migrate deploy` do `start:migrate:prod`. Ou seja: um SHADOW_DATABASE_URL
// copiado por engano derruba o deploy inteiro.
// Como `migrate deploy` não usa shadow para nada, um valor igual ao destino é
// ignorado aqui (com aviso) em vez de propagado: o deploy não quebra e o
// `migrate dev` reclama da falta de shadow, que é o problema real dele.
const shadowIsRedundant = target(mainUrl) === target(shadowUrl);

if (shadowIsRedundant) {
  console.warn(
    `\n⚠️  SHADOW_DATABASE_URL aponta para o MESMO banco do destino (${target(mainUrl)}) e foi ignorada.\n` +
      '    Para `migrate dev`, aponte-a para um banco VAZIO separado\n' +
      '    (local: postgresql://admin:admin@localhost:5440/crivo_shadow?schema=public).\n' +
      '    Para aplicar migrations em produção: `npm run prisma:deploy`.\n',
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Single seed entry point — mode selected internally via SEED_TYPE
    // (full / clean). See prisma/seed.ts.
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: mainUrl,
    // Omitida quando é o mesmo banco do destino — ver comentário acima.
    ...(shadowIsRedundant ? {} : { shadowDatabaseUrl: shadowUrl }),
  },
});
