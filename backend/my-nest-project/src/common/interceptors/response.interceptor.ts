import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { map, Observable } from 'rxjs';

const HIDDEN_KEYS = new Set(['__v', 'passwordHash', 'tokenHash', 'contentText']);

/**
 * Normalizes lean Mongoose documents for the wire: `_id` becomes `id`,
 * internal or sensitive keys are stripped, ObjectIds are stringified.
 */
export function serialize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    // Hydrated documents: serialize their plain representation.
    const source =
      typeof (value as { toObject?: unknown }).toObject === 'function'
        ? (value as { toObject: () => Record<string, unknown> }).toObject()
        : (value as Record<string, unknown>);
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(source)) {
      if (HIDDEN_KEYS.has(key)) continue;
      if (key === '_id') {
        out.id = serialize(v);
        continue;
      }
      out[key] = serialize(v);
    }
    return out;
  }
  return value;
}

/** Wraps every successful response as `{ success: true, data }`. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) return data;
        return { success: true, data: serialize(data ?? null) };
      }),
    );
  }
}
