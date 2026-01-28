import {
  Controller,
  Get,
  NotFoundException,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { ApiResponse, User } from '@nx-shay/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any): Promise<ApiResponse<User>> {
    const stored = await this.usersService.findById(req.user.sub);
    if (!stored) {
      throw new NotFoundException('User not found');
    }
    return {
      status: 'success',
      data: this.usersService.toPublicUser(stored),
    };
  }
}
