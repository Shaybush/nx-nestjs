import { Injectable } from '@nestjs/common';

const WORDS: string[] = [
  'apple', 'brave', 'chair', 'dance', 'eagle', 'flame', 'grape', 'house',
  'ivory', 'joker', 'knife', 'lemon', 'mango', 'noble', 'ocean', 'piano',
  'queen', 'river', 'stone', 'tiger', 'unity', 'vivid', 'wheat', 'xerox',
  'youth', 'zebra', 'beach', 'cloud', 'dream', 'earth', 'frost', 'ghost',
  'heart', 'judge', 'light', 'magic', 'night', 'olive', 'pearl', 'quick',
  'robin', 'solar', 'train', 'ultra', 'valve', 'watch', 'album', 'blaze',
  'crane', 'drift', 'flint', 'globe', 'haste', 'jewel',
];

export interface WordResponse {
  word: string;
  length: number;
}

export interface ValidateGuessDto {
  word: string;
  guess: string;
}

export interface ValidateGuessResponse {
  isCorrect: boolean;
  positions: number[];
}

@Injectable()
export class HangmanService {
  getRandomWord(): WordResponse {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    return { word, length: word.length };
  }

  validateGuess(dto: ValidateGuessDto): ValidateGuessResponse {
    const word = dto.word.toLowerCase();
    const guess = dto.guess.toLowerCase();
    const positions: number[] = [];

    for (let i = 0; i < word.length; i++) {
      if (word[i] === guess) {
        positions.push(i);
      }
    }

    return { isCorrect: positions.length > 0, positions };
  }
}
