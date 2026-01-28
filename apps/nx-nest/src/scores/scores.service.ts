import { Injectable } from '@nestjs/common';
import type { GameScore, LeaderboardEntry, GameMode } from '@nx-shay/shared';
import { UsersService } from '../users/users.service.js';
import { randomUUID } from 'crypto';

export interface SubmitScoreDto {
  word: string;
  guessesUsed: number;
  won: boolean;
  gameMode: GameMode;
  duration: number;
}

@Injectable()
export class ScoresService {
  private scores: GameScore[] = [];

  constructor(private readonly usersService: UsersService) {}

  async submitScore(userId: string, dto: SubmitScoreDto): Promise<GameScore> {
    const score: GameScore = {
      id: randomUUID(),
      userId,
      word: dto.word,
      guessesUsed: dto.guessesUsed,
      won: dto.won,
      gameMode: dto.gameMode,
      duration: dto.duration,
      createdAt: new Date().toISOString(),
    };
    this.scores.push(score);
    return score;
  }

  async getUserScores(userId: string): Promise<GameScore[]> {
    return this.scores.filter((s) => s.userId === userId);
  }

  async getLeaderboard(mode?: GameMode): Promise<LeaderboardEntry[]> {
    let filtered = this.scores;
    if (mode) {
      filtered = filtered.filter((s) => s.gameMode === mode);
    }

    const grouped = new Map<
      string,
      { wins: number; totalGames: number; totalGuesses: number }
    >();

    for (const score of filtered) {
      const entry = grouped.get(score.userId) ?? {
        wins: 0,
        totalGames: 0,
        totalGuesses: 0,
      };
      entry.totalGames++;
      entry.totalGuesses += score.guessesUsed;
      if (score.won) entry.wins++;
      grouped.set(score.userId, entry);
    }

    const entries: LeaderboardEntry[] = [];
    for (const [userId, stats] of grouped) {
      const user = await this.usersService.findById(userId);
      entries.push({
        rank: 0, // assigned after sorting
        username: user?.username ?? 'unknown',
        wins: stats.wins,
        totalGames: stats.totalGames,
        avgGuesses: Math.round((stats.totalGuesses / stats.totalGames) * 100) / 100,
      });
    }

    entries.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.avgGuesses - b.avgGuesses;
    });

    return entries.map((entry, i) => ({ ...entry, rank: i + 1 }));
  }
}
