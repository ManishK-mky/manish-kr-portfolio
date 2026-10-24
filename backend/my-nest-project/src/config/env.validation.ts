import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  @Type(() => Number)
  PORT: number = 4000;

  @IsString()
  MONGODB_URI: string;

  @IsString()
  @MinLength(32, { message: 'JWT_ACCESS_SECRET must be at least 32 characters' })
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' })
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_TTL = '15m';

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  JWT_REFRESH_TTL_DAYS: number = 7;

  /** Comma-separated list of allowed browser origins. */
  @IsString()
  FRONTEND_URL = 'http://localhost:3000';

  @IsEnum(['lax', 'strict', 'none'])
  @IsOptional()
  COOKIE_SAMESITE: 'lax' | 'strict' | 'none' = 'lax';

  @IsString()
  @IsOptional()
  COOKIE_DOMAIN?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET?: string;

  /** Next.js route that receives cache-revalidation webhooks. */
  @IsString()
  @IsOptional()
  FRONTEND_REVALIDATE_URL?: string;

  @IsString()
  @IsOptional()
  REVALIDATE_SECRET?: string;

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  CONTACT_NOTIFY_EMAIL?: string;

  @IsString()
  @IsOptional()
  CONTACT_FROM_EMAIL?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }
  return validated;
}
