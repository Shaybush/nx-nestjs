import { Module } from '@nestjs/common';
import { ScoresController } from './scores.controller.js';
import { LeaderboardController } from './leaderboard.controller.js';
import { ScoresService } from './scores.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  controllers: [ScoresController, LeaderboardController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule {}
