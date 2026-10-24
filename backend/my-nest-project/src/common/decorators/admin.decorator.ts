import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

/**
 * Documents an admin-only route. Authorization itself is enforced globally by
 * JwtAuthGuard, so routes are protected even if this decorator is forgotten.
 */
export const AdminOnly = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({ description: 'Admin role required' }),
  );
