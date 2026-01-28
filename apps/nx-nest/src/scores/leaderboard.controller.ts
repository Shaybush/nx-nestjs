import { Controller, Get, Query } from '@nestjs/common';
import type { ApiResponse, LeaderboardEntry, GameMode } from '@nx-shay/shared';
import { ScoresService } from './scores.service.js';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get()
  async getLeaderboard(
    @Query('mode') mode?: GameMode,
  ): Promise<ApiResponse<LeaderboardEntry[]>> {
    const entries = await this.scoresService.getLeaderboard(mode);
    return { status: 'success', data: entries };
  }
}
