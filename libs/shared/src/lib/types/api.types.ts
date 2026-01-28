export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

export enum GameMode {
  Single = 'single',
  Two = 'two',
}

export enum GameResult {
  Win = 'win',
  Loss = 'loss',
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface GameScore {
  id: string;
  userId: string;
  word: string;
  guessesUsed: number;
  won: boolean;
  gameMode: GameMode;
  duration: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  wins: number;
  totalGames: number;
  avgGuesses: number;
}
