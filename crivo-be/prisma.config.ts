import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Single seed entry point — mode selected internally via SEED_TYPE
    // (full / clean). See prisma/seed.ts.
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    // DIRECT_URL bypasses PgBouncer for CLI operations (migrate, seed, studio)
    url:
      process.env['DIRECT_URL'] ??
      process.env['DATABASE_URL'] ??
      'postgresql://postgres:postgres@localhost:5432/crivo',
    // Usado só por `migrate diff`/`migrate dev` para computar o estado das
    // migrations — precisa de um banco vazio separado do dev/prod.
    shadowDatabaseUrl:
      process.env['SHADOW_DATABASE_URL'] ??
      'postgresql://admin:admin@localhost:5432/crivo_shadow?schema=public',
  },
});
