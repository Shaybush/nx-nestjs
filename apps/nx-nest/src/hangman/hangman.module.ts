import { Module } from '@nestjs/common';
import { HangmanController } from './hangman.controller.js';
import { HangmanService } from './hangman.service.js';

@Module({
  controllers: [HangmanController],
  providers: [HangmanService],
})
export class HangmanModule {}
