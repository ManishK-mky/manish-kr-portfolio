import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { AppConfigService } from '../config/app-config.service.js';
import { UsersService } from '../users/users.service.js';
import { Session } from './schemas/session.schema.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'admin';
  sid: string;
}

interface RefreshTokenPayload {
  sub: string;
  sid: string;
  typ: 'refresh';
  jti: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenMaxAgeMs: number;
}

// Compared against when the email is unknown, so response time doesn't reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-not-a-password', 12);

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
  ) {}

  private get refreshTtlMs() {
    return this.config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000;
  }

  async login(email: string, password: string, userAgent?: string) {
    const user = await this.users.findByEmailWithPassword(email);
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const session = await this.sessions.create({
      user: user._id,
      tokenHash: 'pending',
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
      userAgent: userAgent?.slice(0, 300),
    });
    const tokens = await this.issueTokens(
      { sub: user.id, email: user.email, role: user.role, sid: session.id },
      session._id,
    );
    await this.users.touchLogin(user.id);
    return {
      tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async refresh(refreshToken: string | undefined) {
    const payload = await this.verifyRefresh(refreshToken);
    const session = await this.sessions
      .findById(payload.sid)
      .select('+tokenHash')
      .exec();
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() < Date.now() ||
      session.user.toString() !== payload.sub
    ) {
      throw new UnauthorizedException('Session expired');
    }
    if (session.tokenHash !== sha256(refreshToken!)) {
      // An already-rotated token was replayed: assume it leaked.
      session.revokedAt = new Date();
      await session.save();
      this.logger.warn(`Refresh token reuse detected; session ${session.id} revoked`);
      throw new UnauthorizedException('Session revoked');
    }
    const user = await this.users.findById(payload.sub);
    session.expiresAt = new Date(Date.now() + this.refreshTtlMs);
    await session.save();
    const tokens = await this.issueTokens(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        sid: session.id,
      },
      session._id,
    );
    return {
      tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(refreshToken: string | undefined) {
    try {
      const payload = await this.verifyRefresh(refreshToken);
      await this.sessions
        .updateOne({ _id: payload.sid }, { revokedAt: new Date() })
        .exec();
    } catch {
      // Logging out with an invalid token is still a successful logout.
    }
  }

  async changePassword(
    userId: string,
    sessionId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.users.setPassword(userId, newPassword);
    // Sign out every other device.
    await this.sessions
      .updateMany(
        { user: user._id, _id: { $ne: new Types.ObjectId(sessionId) } },
        { revokedAt: new Date() },
      )
      .exec();
  }

  verifyAccessToken(token: string) {
    return this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret: this.config.jwt.accessSecret,
    });
  }

  private async verifyRefresh(token: string | undefined) {
    if (!token) throw new UnauthorizedException('Missing refresh token');
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.jwt.refreshSecret,
      });
      if (payload.typ !== 'refresh') throw new Error('wrong token type');
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(
    access: AccessTokenPayload,
    sessionId: Types.ObjectId,
  ): Promise<IssuedTokens> {
    const { accessSecret, refreshSecret, accessTtl } = this.config.jwt;
    const accessToken = await this.jwt.signAsync(access, {
      secret: accessSecret,
      expiresIn: accessTtl as `${number}m`,
    });
    const refreshToken = await this.jwt.signAsync(
      {
        sub: access.sub,
        sid: access.sid,
        typ: 'refresh',
        jti: randomUUID(),
      } satisfies RefreshTokenPayload,
      {
        secret: refreshSecret,
        expiresIn: Math.floor(this.refreshTtlMs / 1000),
      },
    );
    await this.sessions
      .updateOne({ _id: sessionId }, { tokenHash: sha256(refreshToken) })
      .exec();
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: accessTtl,
      refreshTokenMaxAgeMs: this.refreshTtlMs,
    };
  }
}
