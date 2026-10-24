import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { AuthService } from '../auth.service.js';

/**
 * Registered globally: every route requires a valid admin access token unless
 * marked @Public(). Tokens are read from the Authorization header only — never
 * from cookies — so authenticated writes are not CSRF-able.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser & { sid: string } }>();
    const header = req.headers.authorization;
    const [scheme, token] = header?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication required');
    }
    let payload;
    try {
      payload = await this.auth.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    if (payload.role !== 'admin') {
      throw new ForbiddenException('Admin role required');
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sid: payload.sid,
    };
    return true;
  }
}
