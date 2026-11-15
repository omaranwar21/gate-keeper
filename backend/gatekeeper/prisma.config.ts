import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Not `env()`: commands like `generate` must work before DATABASE_URL is set.
    url: process.env.DATABASE_URL ?? '',
  },
});
