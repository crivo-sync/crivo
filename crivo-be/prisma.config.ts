import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Single seed entry point — mode selected internally via SEED_TYPE
    // (full / plans / clean / trial-test). See prisma/seed.ts.
    seed: 'npx ts-node prisma/seed.ts',
  },
  datasource: {
    // DIRECT_URL bypasses PgBouncer for CLI operations (migrate, seed, studio)
    url:
      process.env['DIRECT_URL'] ??
      process.env['DATABASE_URL'] ??
      'postgresql://postgres:postgres@localhost:5432/crivo',
  },
});
