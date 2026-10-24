import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { createObserveModule } from '@nestjs/observe';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module.js';
import { BlogModule } from './blog/blog.module.js';
import { CommonModule } from './common/common.module.js';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { RateLimitGuard } from './common/rate-limit/rate-limit.guard.js';
import { CompaniesModule } from './companies/companies.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { AppConfigModule } from './config/config.module.js';
import { ContactModule } from './contact/contact.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { EducationModule } from './education/education.module.js';
import { ExperienceModule } from './experience/experience.module.js';
import { HealthModule } from './health/health.module.js';
import { MediaModule } from './media/media.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { SocialLinksModule } from './social-links/social-links.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

/**
 * NestJS Observe (tracing/metrics) is enabled only when its credentials are
 * configured. Run `npx @nestjs/observe link` to write them into .env.
 */
export const observeEnabled = Boolean(
  process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_SECRET,
);

@Module({
  imports: [
    AppConfigModule,
    ...(observeEnabled
      ? [
          ObserveModule.forRoot({
            appKey: process.env.OBSERVE_APP_KEY!,
            appSecret: process.env.OBSERVE_APP_SECRET!,
            serviceId: 'portfolio-api',
          }),
        ]
      : []),
    MongooseModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        uri: config.mongoUri,
        // Collections are small, so building indexes on boot is cheap and keeps
        // unique constraints (slugs, emails) enforced in every environment.
        autoIndex: true,
        serverSelectionTimeoutMS: 10_000,
      }),
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    MediaModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    SettingsModule,
    SocialLinksModule,
    ProjectsModule,
    CompaniesModule,
    ExperienceModule,
    EducationModule,
    SkillsModule,
    BlogModule,
    ContactModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
