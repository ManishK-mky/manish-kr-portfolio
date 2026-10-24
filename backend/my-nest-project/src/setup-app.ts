import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { CSRF_HEADER } from './auth/guards/csrf.guard.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AppConfigService } from './config/app-config.service.js';

export const API_PREFIX = 'api/v1';

/** Shared by main.ts and the e2e tests so both run the same pipeline. */
export function setupApp(app: INestApplication, { swagger = true } = {}) {
  const config = app.get(AppConfigService);
  const express = app as NestExpressApplication;

  // Honour X-Forwarded-For from the platform's load balancer for rate limits.
  express.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
  express.disable('x-powered-by');

  app.use(
    helmet({
      // JSON API: no HTML to protect with CSP, and Swagger UI needs inline assets.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());

  app.enableCors({
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Non-browser clients (curl, server-side rendering) send no Origin.
      if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', CSRF_HEADER],
    maxAge: 600,
  });

  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableShutdownHooks();

  if (swagger) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Portfolio CMS API')
        .setDescription(
          'REST API for the portfolio and its admin dashboard. Responses are wrapped as `{ success, data }`; errors as `{ success: false, error }`.',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs/json',
    });
  }
}
