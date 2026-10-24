import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

/**
 * Fixed-window rate limiting per client IP and route.
 *
 * Replaces @nestjs/throttler, which is still CommonJS and `require()`s the
 * ESM-only @nestjs/common v12 — that crashes on runtimes without require(esm)
 * support, such as Vercel Functions.
 *
 * Counters live in memory, so limits apply per instance. Use a shared store
 * (e.g. Redis) if strict limits across instances matter.
 */

export interface RateLimitOptions {
  limit: number;
  ttlMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitOptions = { limit: 120, ttlMs: 60_000 };
const RATE_LIMIT_KEY = 'rateLimit';
const SKIP_RATE_LIMIT_KEY = 'skipRateLimit';
const MAX_TRACKED_KEYS = 50_000;

/** Overrides the default limit for a route or controller. */
export const RateLimit = (limit: number, ttlMs: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, ttlMs } satisfies RateLimitOptions);

/** Exempts a route or controller from rate limiting. */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, targets)) return true;

    const { limit, ttlMs } =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, targets) ??
      DEFAULT_RATE_LIMIT;
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const key = `${req.ip ?? 'unknown'}|${route}`;

    const now = Date.now();
    let entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (this.hits.size >= MAX_TRACKED_KEYS) this.sweep(now);
      entry = { count: 0, resetAt: now + ttlMs };
      this.hits.set(key, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, limit - entry.count);
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    if (entry.count > limit) {
      res.setHeader('Retry-After', retryAfter);
      throw new HttpException(
        `Too many requests. Try again in ${retryAfter}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  /** Drops expired windows so memory stays bounded. */
  private sweep(now: number) {
    for (const [key, entry] of this.hits) {
      if (entry.resetAt <= now) this.hits.delete(key);
    }
    if (this.hits.size >= MAX_TRACKED_KEYS) this.hits.clear();
  }
}
