# GateKeeper API (NestJS)

See the [main README](../../README.md) for setup, architecture, decisions and deployment.

```bash
cp .env.example .env       # DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT
npm install                # also runs `prisma generate`
npx prisma migrate deploy  # apply migrations
npm run db:seed            # demo data
npm run dev                # http://localhost:3000/v1
npm test                   # unit tests
npm run test:e2e           # integration tests (needs a disposable DATABASE_URL)
```

Data model: [docs/er-diagram.md](docs/er-diagram.md)
