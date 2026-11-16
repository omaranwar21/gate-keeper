// Runs its own app instance on its own port, isolated from
// guest-pass-flow.e2e-spec.ts's login calls, so this suite's own login
// attempts are the only ones counted against the 5/min throttle bucket
// being tested here.
import { spawn, type ChildProcess } from 'child_process';
import request from 'supertest';

jest.setTimeout(60_000);

const ROOT_DIR = `${__dirname}/..`;
const PORT = 3097;
const BASE_URL = `http://localhost:${PORT}/v1`;

let server: ChildProcess;

async function waitForServer() {
  // Deliberately not /auth/login: that route is the one under test below,
  // and a readiness probe hitting it would itself count against the
  // 5-request budget before the test's own attempts even start.
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await request(BASE_URL).get('/buildings');
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('Server did not start in time');
}

beforeAll(async () => {
  server = spawn('node', ['dist/main.js'], {
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  await waitForServer();
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.once('exit', () => resolve());
    server.kill();
  });
});

describe('rate limiting', () => {
  it('throttles login after 5 attempts within a minute, with a translated 429', async () => {
    const credentials = { email: 'nobody@example.com', password: 'wrong-password' };

    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await request(BASE_URL).post('/auth/login').send(credentials);
      expect(res.status).toBe(401);
    }

    const sixth = await request(BASE_URL).post('/auth/login').send(credentials);
    expect(sixth.status).toBe(429);
    expect(sixth.body).toMatchObject({ statusCode: 429, error: 'Too Many Requests' });
  });

  it('does not apply the login-specific limit to an unrelated route', async () => {
    // 401 (unauthenticated), not 429 — confirms this route has its own
    // bucket under the global default, separate from the login override.
    const res = await request(BASE_URL).get('/buildings');
    expect(res.status).toBe(401);
  });
});
