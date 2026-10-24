import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/** Trims strings; leaves other values for the validators to reject. */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/** An optional http(s) URL. Empty string clears the field. */
export const OptionalUrl = () =>
  applyDecorators(
    Trim(),
    IsOptional(),
    ValidateIf((_o, v) => v !== ''),
    IsUrl({ protocols: ['http', 'https'], require_protocol: true }),
    MaxLength(500),
  );

/** An optional list of short, trimmed, non-empty strings. */
export const StringList = (maxItems = 50, maxLength = 500) =>
  applyDecorators(
    IsOptional(),
    Transform(({ value }) =>
      Array.isArray(value)
        ? value
            .map((v) => (typeof v === 'string' ? v.trim() : v))
            .filter((v) => v !== '')
        : value,
    ),
    IsArray(),
    ArrayMaxSize(maxItems),
    IsString({ each: true }),
    MaxLength(maxLength, { each: true }),
  );
