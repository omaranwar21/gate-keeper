// Full-stack integration test: runs the real built app as a separate OS
// process (so Jest's module loader never has to require() @nestjs/* — see
// AGENTS.md's note that Nest's packages are ESM-only, which is why unit
// specs stay Nest-import-free) and drives it over real HTTP with supertest.
//
// Covers auth + role-guard enforcement end to end, and — the brief's
// headline concurrency requirement — proves a one-time pass can't be
// scanned twice even when two scans race each other concurrently.
import 'dotenv/config';
import { spawn, type ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

jest.setTimeout(90_000);

const ROOT_DIR = `${__dirname}/..`;
const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}/v1`;
const PASSWORD = 'E2e-test-password-1';
const suffix = randomUUID().slice(0, 8);

const emails = {
  admin: `e2e-admin-${suffix}@example.com`,
  resident: `e2e-resident-${suffix}@example.com`,
  guard: `e2e-guard-${suffix}@example.com`,
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

let server: ChildProcess;
let adminToken: string;
let residentToken: string;
let guardToken: string;
let residentId: string;
let guardId: string;
let buildingId: string;
let unitId: string;

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await request(BASE_URL).post('/auth/login').send({});
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('Server did not start in time');
}

async function login(email: string): Promise<string> {
  const res = await request(BASE_URL).post('/auth/login').send({ email, password: PASSWORD });
  return res.body.data.accessToken;
}

function futureOneTimeWindow() {
  return {
    validFrom: new Date(Date.now() - 60_000).toISOString(),
    validUntil: new Date(Date.now() + 60 * 60_000).toISOString(),
  };
}

beforeAll(async () => {
  // The build itself runs once in Jest's globalSetup (test/global-setup.js),
  // shared across every e2e spec file — not here, to avoid two spec files
  // racing on dist/ when Jest runs them in parallel workers.
  server = spawn('node', ['dist/main.js'], {
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  await waitForServer();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const [, resident, guard] = await Promise.all([
    prisma.user.create({ data: { email: emails.admin, passwordHash, fullName: 'E2E Admin', role: 'admin' } }),
    prisma.user.create({ data: { email: emails.resident, passwordHash, fullName: 'E2E Resident', role: 'resident' } }),
    prisma.user.create({ data: { email: emails.guard, passwordHash, fullName: 'E2E Guard', role: 'guard' } }),
  ]);
  residentId = resident.id;
  guardId = guard.id;

  adminToken = await login(emails.admin);
  residentToken = await login(emails.resident);
  guardToken = await login(emails.guard);

  const buildingRes = await request(BASE_URL)
    .post('/buildings')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `E2E Building ${suffix}` });
  buildingId = buildingRes.body.data.id;

  const unitRes = await request(BASE_URL)
    .post('/units')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ buildingId, number: '101' });
  unitId = unitRes.body.data.id;

  await request(BASE_URL)
    .post(`/units/${unitId}/residents`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId: residentId });
});

afterAll(async () => {
  // guardId, not unitId: the invalid-token scan logs an AccessLog row with
  // unitId null (no pass matched), which would otherwise survive and block
  // deleting the guard user below (AccessLog.guard is onDelete: Restrict).
  await prisma.accessLog.deleteMany({ where: { guardId } });
  await prisma.guestPass.deleteMany({ where: { unitId } });
  await prisma.unit.deleteMany({ where: { id: unitId } });
  await prisma.building.deleteMany({ where: { id: buildingId } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  await prisma.$disconnect();

  await new Promise<void>((resolve) => {
    server.once('exit', () => resolve());
    server.kill();
  });
});

describe('authentication and role guards', () => {
  it('rejects an unauthenticated request to an admin-only route', async () => {
    await request(BASE_URL).get('/buildings').expect(401);
  });

  it('rejects a resident on an admin-only route', async () => {
    await request(BASE_URL).get('/buildings').set('Authorization', `Bearer ${residentToken}`).expect(403);
  });

  it('lets an admin through', async () => {
    await request(BASE_URL).get('/buildings').set('Authorization', `Bearer ${adminToken}`).expect(200);
  });
});

describe('guest pass scan decision', () => {
  it('allows a scan within the valid window, then denies a repeat as already_used', async () => {
    const createRes = await request(BASE_URL)
      .post('/passes')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ unitId, guestName: 'First Guest', type: 'one_time', ...futureOneTimeWindow() });
    const token = createRes.body.data.token;

    const first = await request(BASE_URL).post('/passes/scan').set('Authorization', `Bearer ${guardToken}`).send({ token });
    expect(first.body.result).toBe('allowed');

    const second = await request(BASE_URL).post('/passes/scan').set('Authorization', `Bearer ${guardToken}`).send({ token });
    expect(second.body).toMatchObject({ result: 'denied', reason: 'already_used' });
  });

  it('denies an unknown token as invalid_token', async () => {
    const res = await request(BASE_URL)
      .post('/passes/scan')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ token: 'not-a-real-token' });

    expect(res.body).toMatchObject({ result: 'denied', reason: 'invalid_token' });
  });

  it('allows exactly one of two concurrent scans of the same one-time pass', async () => {
    const createRes = await request(BASE_URL)
      .post('/passes')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ unitId, guestName: 'Race Guest', type: 'one_time', ...futureOneTimeWindow() });
    const token = createRes.body.data.token;

    const [first, second] = await Promise.all([
      request(BASE_URL).post('/passes/scan').set('Authorization', `Bearer ${guardToken}`).send({ token }),
      request(BASE_URL).post('/passes/scan').set('Authorization', `Bearer ${guardToken}`).send({ token }),
    ]);

    const results: string[] = [first.body.result, second.body.result].sort((a, b) => a.localeCompare(b));
    expect(results).toEqual(['allowed', 'denied']);
  });
});
