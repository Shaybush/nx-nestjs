import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from '@nx-shay/backend-filters';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { ScoresModule } from '../scores/scores.module.js';
import { HangmanModule } from '../hangman/hangman.module.js';

@Module({
  imports: [AuthModule, UsersModule, ScoresModule, HangmanModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
