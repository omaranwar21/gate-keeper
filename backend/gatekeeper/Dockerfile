# Build stage: needs devDependencies (ts-loader, @nestjs/cli, typescript...)
# to compile src/ -> dist/, which the runtime stage doesn't.
FROM node:22-alpine AS build
WORKDIR /app

# The schema must exist before `npm ci`, since its postinstall hook runs
# `prisma generate`, which reads prisma/schema.prisma to write the generated
# client into src/generated/prisma (gitignored, rebuilt on every install).
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# .dockerignore excludes node_modules, dist and src/generated so this copy
# can't overwrite the client npm ci just generated with a stale local one.
COPY . .
RUN npm run build

# Runtime stage: only the compiled output and production dependencies.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# --ignore-scripts: skip postinstall's `prisma generate` here. It isn't
# needed again — dist/generated/prisma (copied below) already has the
# compiled client from the build stage — and running it would require
# copying prisma/schema.prisma in just to regenerate what we already have.
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/dist ./dist
# Kept separately (not from the build stage's node_modules) because `prisma
# migrate deploy` below needs the schema + migration files, not the client.
COPY prisma ./prisma
# Prisma 7 reads datasource.url from here, not from schema.prisma — without
# it, `migrate deploy` fails even though DATABASE_URL is set in the
# environment, because it never looks at schema.prisma for the URL anymore.
COPY prisma.config.ts ./

EXPOSE 3000

# Applies any pending migrations before every start, so a fresh database
# (first `docker compose up`) or a new migration (after a `git pull`) is
# handled automatically — this is the local/dev equivalent of the manual
# `prisma migrate deploy` step the README describes for Render+Supabase.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
