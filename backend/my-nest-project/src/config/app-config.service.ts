import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from './env.validation.js';

/** Typed accessors over the validated environment. */
@Injectable()
export class AppConfigService {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  get isProduction() {
    return this.config.get('NODE_ENV', { infer: true }) === 'production';
  }

  get port() {
    return this.config.get('PORT', { infer: true });
  }

  get mongoUri() {
    return this.config.get('MONGODB_URI', { infer: true });
  }

  get allowedOrigins(): string[] {
    return this.config
      .get('FRONTEND_URL', { infer: true })
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean);
  }

  get jwt() {
    return {
      accessSecret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      refreshSecret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      accessTtl: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      refreshTtlDays: this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true }),
    };
  }

  get cookie() {
    return {
      sameSite: this.config.get('COOKIE_SAMESITE', { infer: true }),
      domain: this.config.get('COOKIE_DOMAIN', { infer: true }) || undefined,
      secure:
        this.isProduction ||
        this.config.get('COOKIE_SAMESITE', { infer: true }) === 'none',
    };
  }

  get cloudinary() {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    const apiKey = this.config.get('CLOUDINARY_API_KEY', { infer: true });
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET', { infer: true });
    return {
      cloudName,
      apiKey,
      apiSecret,
      configured: Boolean(cloudName && apiKey && apiSecret),
    };
  }

  /**
   * Webhook target. An explicit FRONTEND_REVALIDATE_URL wins. On Vercel the
   * site shares this deployment's domain, so the public URL is derived from
   * Vercel's system variables. (A web ← api binding isn't possible: web already
   * binds to api, and Vercel rejects circular bindings.)
   */
  get revalidation() {
    const explicit = this.config.get('FRONTEND_REVALIDATE_URL', { infer: true });
    const { VERCEL_ENV, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL } = process.env;
    const host =
      VERCEL_ENV === 'production' && VERCEL_PROJECT_PRODUCTION_URL ? VERCEL_PROJECT_PRODUCTION_URL : VERCEL_URL;
    return {
      url: explicit || (host ? `https://${host}/api/revalidate` : undefined),
      secret: this.config.get('REVALIDATE_SECRET', { infer: true }),
    };
  }

  get email() {
    return {
      resendApiKey: this.config.get('RESEND_API_KEY', { infer: true }),
      notifyTo: this.config.get('CONTACT_NOTIFY_EMAIL', { infer: true }),
      from: this.config.get('CONTACT_FROM_EMAIL', { infer: true }),
    };
  }
}
