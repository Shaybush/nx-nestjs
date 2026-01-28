import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { ApiResponse, GameScore } from '@nx-shay/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ScoresService, SubmitScoreDto } from './scores.service.js';

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async submitScore(
    @Request() req: any,
    @Body() dto: SubmitScoreDto,
  ): Promise<ApiResponse<GameScore>> {
    const score = await this.scoresService.submitScore(req.user.sub, dto);
    return { status: 'success', data: score };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyScores(@Request() req: any): Promise<ApiResponse<GameScore[]>> {
    const scores = await this.scoresService.getUserScores(req.user.sub);
    return { status: 'success', data: scores };
  }

}
