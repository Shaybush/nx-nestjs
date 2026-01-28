import { Controller, Get, Post, Body } from '@nestjs/common';
import { HangmanService, ValidateGuessDto } from './hangman.service.js';

@Controller('hangman')
export class HangmanController {
  constructor(private readonly hangmanService: HangmanService) {}

  @Get('word')
  getWord() {
    return { data: this.hangmanService.getRandomWord() };
  }

  @Post('validate-guess')
  validateGuess(@Body() dto: ValidateGuessDto) {
    return { data: this.hangmanService.validateGuess(dto) };
  }
}
