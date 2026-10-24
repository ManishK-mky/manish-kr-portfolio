import { ADMIN, CSRF, ORIGIN, createTestApp, type TestContext } from './helpers/test-app.js';

/**
 * Login is limited to 5 attempts per minute per client, so this suite budgets
 * its logins: 2 failed + 3 successful, then asserts the 6th is throttled.
 */
describe('Auth (e2e)', () => {
  let ctx: TestContext;
  let session: { token: string; cookie: string; setCookie: string };

  beforeAll(async () => {
    ctx = await createTestApp();
    const res = await ctx.http().post('/api/v1/auth/login').send(ADMIN).expect(200);
    const setCookie = ([] as string[]).concat(res.headers['set-cookie']).join(';');
    session = {
      token: res.body.data.accessToken,
      cookie: setCookie.match(/pf_rt=[^;]+/)![0],
      setCookie,
    };
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
  afterAll(() => ctx.close());

  it('sets an HttpOnly refresh cookie scoped to the auth path', () => {
    expect(session.token).toEqual(expect.any(String));
    expect(session.setCookie).toMatch(/HttpOnly/i);
    expect(session.setCookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(session.setCookie).toMatch(/SameSite=Lax/i);
  });

  it('rejects a wrong password without revealing whether the account exists', async () => {
    const wrongPw = await ctx
      .http()
      .post('/api/v1/auth/login')
      .send({ email: ADMIN.email, password: 'nope' })
      .expect(401);
    const unknown = await ctx
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'ghost@test.dev', password: 'nope' })
      .expect(401);
    expect(wrongPw.body.error.message).toBe(unknown.body.error.message);
  });

  it('protects /auth/me and accepts a valid bearer token', async () => {
    await ctx.http().get('/api/v1/auth/me').expect(401);
    await ctx.http().get('/api/v1/auth/me').set('authorization', 'Bearer garbage').expect(401);
    const me = await ctx
      .http()
      .get('/api/v1/auth/me')
      .set('authorization', `Bearer ${session.token}`)
      .expect(200);
    expect(me.body.data.email).toBe(ADMIN.email);
  });

  it('requires the CSRF header and an allowed origin to refresh', async () => {
    await ctx.http().post('/api/v1/auth/refresh').set('cookie', session.cookie).expect(403);
    await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .set('cookie', session.cookie)
      .set(CSRF)
      .set('origin', 'https://evil.example')
      .expect(403);
  });

  it('accepts a same-origin refresh even when that origin is not allow-listed', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .set('cookie', session.cookie)
      .set(CSRF)
      .set('host', 'preview-abc.vercel.app')
      .set('origin', 'https://preview-abc.vercel.app')
      .expect(200);
    const rotated = ([] as string[])
      .concat(res.headers['set-cookie'])
      .find((c) => c.startsWith('pf_rt='))!
      .split(';')[0];
    session.cookie = rotated;
  });

  it('rotates refresh tokens and revokes the session when an old token is replayed', async () => {
    const { cookie: first } = await ctx.login();
    const rotated = await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .set('cookie', first)
      .set(CSRF)
      .set('origin', ORIGIN)
      .expect(200);
    const second = ([] as string[])
      .concat(rotated.headers['set-cookie'])
      .find((c) => c.startsWith('pf_rt='))!
      .split(';')[0];
    expect(second).not.toBe(first);
    expect(rotated.body.data.accessToken).toEqual(expect.any(String));

    // Replaying the first token is treated as theft…
    await ctx.http().post('/api/v1/auth/refresh').set('cookie', first).set(CSRF).expect(401);
    // …so even the legitimately rotated token stops working.
    await ctx.http().post('/api/v1/auth/refresh').set('cookie', second).set(CSRF).expect(401);
  });

  it('logout revokes the session', async () => {
    const { cookie } = await ctx.login();
    await ctx.http().post('/api/v1/auth/logout').set('cookie', cookie).set(CSRF).expect(200);
    await ctx.http().post('/api/v1/auth/refresh').set('cookie', cookie).set(CSRF).expect(401);
  });

  it('has no public signup endpoint', async () => {
    await ctx
      .http()
      .post('/api/v1/auth/register')
      .send({ email: 'x@y.z', password: 'whatever-long-pass' })
      .expect(404);
  });

  it('rate-limits login attempts', async () => {
    const res = await ctx.http().post('/api/v1/auth/login').send(ADMIN).expect(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
