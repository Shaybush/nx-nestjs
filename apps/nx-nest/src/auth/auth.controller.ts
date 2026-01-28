import { Body, Controller, Post } from '@nestjs/common';
import type {
  ApiResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from '@nx-shay/shared';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterRequest,
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const data = await this.authService.register(dto);
    return { status: 'success', data };
  }

  @Post('login')
  async login(
    @Body() dto: LoginRequest,
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const data = await this.authService.login(dto);
    return { status: 'success', data };
  }

  @Post('refresh')
  async refresh(
    @Body() body: { refreshToken: string },
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const data = await this.authService.refresh(body.refreshToken);
    return { status: 'success', data };
  }
}
