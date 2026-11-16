import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Builds first so the compiled dist/prisma/seed.js is always current —
    // see src/prisma/seed.ts for why it can't run straight from source.
    seed: 'npm run db:seed',
  },
  datasource: {
    // Not `env()`: commands like `generate` must work before DATABASE_URL is set.
    url: process.env.DATABASE_URL ?? '',
  },
});
