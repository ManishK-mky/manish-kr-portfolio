import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '../common/rate-limit/rate-limit.guard.js';
import type { CookieOptions, Request, Response } from 'express';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { AppConfigService } from '../config/app-config.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService, type IssuedTokens } from './auth.service.js';
import { ChangePasswordDto, LoginDto } from './dto/auth.dto.js';
import { CSRF_HEADER, CSRF_HEADER_VALUE, CsrfGuard } from './guards/csrf.guard.js';

export const REFRESH_COOKIE = 'pf_rt';
const COOKIE_PATH = '/api/v1/auth';

const csrfHeaderDoc = ApiHeader({
  name: CSRF_HEADER,
  required: true,
  description: `Must be "${CSRF_HEADER_VALUE}"`,
});

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @RateLimit(5, 60_000)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in; sets an HttpOnly refresh-token cookie' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.auth.login(
      dto.email,
      dto.password,
      req.headers['user-agent'],
    );
    this.setRefreshCookie(res, tokens);
    return this.tokenResponse(tokens, user);
  }

  @Public()
  @UseGuards(CsrfGuard)
  @RateLimit(30, 60_000)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @csrfHeaderDoc
  @ApiOperation({ summary: 'Rotate the refresh token and get a new access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { tokens, user } = await this.auth.refresh(
        req.cookies?.[REFRESH_COOKIE],
      );
      this.setRefreshCookie(res, tokens);
      return this.tokenResponse(tokens, user);
    } catch (err) {
      this.clearRefreshCookie(res);
      throw err;
    }
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @csrfHeaderDoc
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    this.clearRefreshCookie(res);
    return { loggedOut: true };
  }

  @Get('me')
  @AdminOnly()
  @ApiOperation({ summary: 'Current admin user' })
  async me(@CurrentUser() user: AuthUser) {
    const { _id, email, name, role, lastLoginAt } = await this.users.findById(
      user.id,
    );
    return { id: _id, email, name, role, lastLoginAt };
  }

  @Patch('password')
  @AdminOnly()
  @RateLimit(5, 60_000)
  @ApiOperation({ summary: 'Change password and sign out other sessions' })
  async changePassword(
    @CurrentUser() user: AuthUser & { sid: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.auth.changePassword(
      user.id,
      user.sid,
      dto.currentPassword,
      dto.newPassword,
    );
    return { updated: true };
  }

  private cookieOptions(): CookieOptions {
    const { sameSite, secure, domain } = this.config.cookie;
    return { httpOnly: true, secure, sameSite, domain, path: COOKIE_PATH };
  }

  private setRefreshCookie(res: Response, tokens: IssuedTokens) {
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.cookieOptions(),
      maxAge: tokens.refreshTokenMaxAgeMs,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  private tokenResponse(tokens: IssuedTokens, user: unknown) {
    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.accessTokenExpiresIn,
      user,
    };
  }
}
