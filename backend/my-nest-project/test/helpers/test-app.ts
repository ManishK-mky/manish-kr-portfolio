import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import type { App } from 'supertest/types.js';

export const ADMIN = { email: 'admin@test.dev', password: 'correct-horse-battery-staple' };
export const ORIGIN = 'http://localhost:3000';
export const CSRF = { 'x-requested-with': 'portfolio-admin' };

export interface TestContext {
  app: INestApplication<App>;
  http: () => ReturnType<typeof request>;
  mongo: MongoMemoryServer;
  login: () => Promise<{ token: string; cookie: string }>;
  close: () => Promise<void>;
}

/**
 * Boots the real AppModule against an in-memory MongoDB. Env vars are set
 * before the app modules are imported because config is validated at import.
 */
export async function createTestApp(): Promise<TestContext> {
  const mongo = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongo.getUri('portfolio-test'),
    JWT_ACCESS_SECRET: 'test-access-secret-that-is-long-enough-123',
    JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-long-enough-456',
    FRONTEND_URL: ORIGIN,
    FRONTEND_REVALIDATE_URL: '',
    CLOUDINARY_CLOUD_NAME: '',
    CLOUDINARY_API_KEY: '',
    CLOUDINARY_API_SECRET: '',
  });

  const { AppModule } = await import('../../src/app.module.js');
  const { setupApp } = await import('../../src/setup-app.js');
  const { UsersService } = await import('../../src/users/users.service.js');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  setupApp(app, { swagger: false });
  await app.init();
  await app.get(UsersService).createAdmin(ADMIN.email, 'Test Admin', ADMIN.password);

  const http = () => request(app.getHttpServer());
  return {
    app,
    http,
    mongo,
    login: async () => {
      const res = await http().post('/api/v1/auth/login').send(ADMIN).expect(200);
      const cookie = ([] as string[])
        .concat(res.headers['set-cookie'] ?? [])
        .find((c) => c.startsWith('pf_rt='))!;
      return { token: res.body.data.accessToken as string, cookie: cookie.split(';')[0] };
    },
    close: async () => {
      await app.close();
      await mongo.stop();
    },
  };
}
