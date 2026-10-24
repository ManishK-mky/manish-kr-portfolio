import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../../config/app-config.service.js';

export const CSRF_HEADER = 'x-requested-with';
export const CSRF_HEADER_VALUE = 'portfolio-admin';

/**
 * Protects the cookie-authenticated endpoints (refresh, logout). A cross-site
 * form can't set custom headers, and a cross-origin script that tries triggers
 * a CORS preflight, which only allowed origins pass. Any Origin header present
 * must also be allowlisted.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.headers[CSRF_HEADER] !== CSRF_HEADER_VALUE) {
      throw new ForbiddenException('Missing CSRF header');
    }
    const origin = req.headers.origin;
    if (origin && !this.config.allowedOrigins.includes(origin) && !isSameOrigin(req, origin)) {
      throw new ForbiddenException('Origin not allowed');
    }
    return true;
  }
}

/**
 * True when the page that sent the request is served from the same host as the
 * API — the case on Vercel, where site and API share one domain (including
 * per-deployment preview URLs that can't be listed in FRONTEND_URL).
 */
function isSameOrigin(req: Request, origin: string): boolean {
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const forwarded = req.headers['x-forwarded-host'];
  const hosts = [req.headers.host, ...(Array.isArray(forwarded) ? forwarded : [forwarded])]
    .flatMap((h) => (h ?? '').split(','))
    .map((h) => h.trim())
    .filter(Boolean);
  return hosts.includes(originHost);
}
