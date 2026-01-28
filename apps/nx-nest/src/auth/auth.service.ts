import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from '@nx-shay/shared';
import { UsersService } from '../users/users.service.js';

const JWT_SECRET = process.env['JWT_SECRET'] || 'dev-secret';
const ACCESS_EXPIRY = process.env['JWT_ACCESS_EXPIRY'] || '15m';
const REFRESH_EXPIRY = process.env['JWT_REFRESH_EXPIRY'] || '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    dto: RegisterRequest,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.usersService.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const stored = await this.usersService.create(dto.username, passwordHash);
    const tokens = this.generateTokens(stored.id, stored.username);
    return { user: this.usersService.toPublicUser(stored), tokens };
  }

  async login(
    dto: LoginRequest,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const stored = await this.usersService.findByUsername(dto.username);
    if (!stored) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, stored.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(stored.id, stored.username);
    return { user: this.usersService.toPublicUser(stored), tokens };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: JWT_SECRET,
      });
      const accessToken = this.jwtService.sign(
        { sub: payload.sub, username: payload.username },
        { expiresIn: ACCESS_EXPIRY },
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(userId: string, username: string): AuthTokens {
    const payload = { sub: userId, username };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_EXPIRY,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: REFRESH_EXPIRY,
    });
    return { accessToken, refreshToken };
  }
}
