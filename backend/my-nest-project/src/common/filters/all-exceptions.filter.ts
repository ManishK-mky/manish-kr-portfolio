import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Error as MongooseError, mongo } from 'mongoose';

interface ErrorBody {
  success: false;
  error: {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  };
  path: string;
  timestamp: string;
}

const CODE_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const m = (body as { message?: unknown }).message;
        if (Array.isArray(m)) {
          message = 'Validation failed';
          details = m;
        } else if (typeof m === 'string') {
          message = m;
        }
        const extra = (body as { details?: unknown }).details;
        if (extra !== undefined) details = extra;
      }
    } else if (
      exception instanceof mongo.MongoServerError &&
      exception.code === 11000
    ) {
      status = HttpStatus.CONFLICT;
      const fields = Object.keys(exception.keyValue ?? {});
      message = fields.length
        ? `A record with this ${fields.join(', ')} already exists`
        : 'Duplicate record';
      details = { fields };
    } else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      details = Object.values(exception.errors).map((e) => e.message);
    } else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid value for ${exception.path}`;
    } else if (
      exception instanceof Error &&
      (exception as { type?: string }).type === 'entity.too.large'
    ) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'Request body is too large';
    }

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.originalUrl.split('?')[0]} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorBody = {
      success: false,
      error: {
        statusCode: status,
        code: CODE_BY_STATUS[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR'),
        message,
        ...(details !== undefined ? { details } : {}),
      },
      path: req.originalUrl.split('?')[0],
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(body);
  }
}
