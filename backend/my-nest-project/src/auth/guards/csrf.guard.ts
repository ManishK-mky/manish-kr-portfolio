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
    if (origin && !this.config.allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Origin not allowed');
    }
    return true;
  }
}
