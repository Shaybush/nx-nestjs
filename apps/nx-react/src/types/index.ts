export const GameMode = {
  SINGLE_PLAYER: 'SINGLE_PLAYER',
  TWO_PLAYER: 'TWO_PLAYER'
} as const;

export type GameMode = typeof GameMode[keyof typeof GameMode];

export interface GameState {
  word: string;
  revealedLetters: string[];
  wrongGuesses: number;
  usedLetters: string[];
  gameStatus: 'playing' | 'won' | 'lost';
  maxAttempts: number;
}

export interface Player {
  name: string;
  score: number;
}
export interface TwoPlayerState {
  player1: Player;
  player2: Player;
  currentPlayer: 1 | 2;
  roundNumber: number;
}
