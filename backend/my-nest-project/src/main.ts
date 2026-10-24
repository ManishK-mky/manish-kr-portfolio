import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument, observeEnabled } from './app.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { setupApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: observeEnabled ? ObserveInstrument : undefined,
  });
  setupApp(app, { swagger: process.env.SWAGGER_ENABLED !== 'false' });

  const config = app.get(AppConfigService);
  await app.listen(config.port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(`API ready on http://localhost:${config.port}/api/v1`);
  logger.log(`Swagger docs on http://localhost:${config.port}/api/docs`);
  if (!config.cloudinary.configured) {
    logger.warn('Cloudinary is not configured — media uploads are disabled.');
  }
}
await bootstrap();
