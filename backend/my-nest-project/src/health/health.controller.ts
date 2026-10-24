import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipRateLimit } from '../common/rate-limit/rate-limit.guard.js';
import type { Response } from 'express';
import type { Connection } from 'mongoose';
import { Public } from '../common/decorators/public.decorator.js';

const STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @SkipRateLimit()
  @Get()
  @ApiOperation({ summary: 'Liveness and database connectivity' })
  check(@Res({ passthrough: true }) res: Response) {
    const db = STATES[this.connection.readyState] ?? 'unknown';
    const ok = db === 'connected';
    res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: ok ? 'ok' : 'degraded',
      database: db,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
