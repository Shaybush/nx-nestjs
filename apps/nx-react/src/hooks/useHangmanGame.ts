import { useState, useCallback } from 'react';
import type { GameState } from '../types';
import { getRandomWord, validateGuess } from '../api';

const MAX_ATTEMPTS = 6;

const initialGameState: GameState = {
  word: '',
  revealedLetters: [],
  wrongGuesses: 0,
  usedLetters: [],
  gameStatus: 'playing',
  maxAttempts: MAX_ATTEMPTS
};

export function useHangmanGame() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { word } = await getRandomWord();
      setGameState({
        ...initialGameState,
        word: word.toUpperCase()
      });
    } catch (err) {
      setError('Failed to start game. Please try again.');
      console.error('Error starting game:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const makeGuess = useCallback(async (letter: string) => {
    if (gameState.gameStatus !== 'playing' || isGuessing) {
      return;
    }

    const lowerLetter = letter.toLowerCase();

    // Check if letter already used
    if (gameState.usedLetters.includes(lowerLetter)) {
      return;
    }

    setIsGuessing(true);
    setError(null);

    try {
      // Validate guess with backend
      const { isCorrect } = await validateGuess(
        gameState.word,
        lowerLetter
      );

      setGameState((prevState) => {
        const newUsedLetters = [...prevState.usedLetters, lowerLetter];
        const newRevealedLetters = isCorrect
          ? [...prevState.revealedLetters, lowerLetter]
          : prevState.revealedLetters;
        const newWrongGuesses = isCorrect
          ? prevState.wrongGuesses
          : prevState.wrongGuesses + 1;

        // Check win condition - all unique letters in word are revealed
        const uniqueLetters = new Set(
          prevState.word.toLowerCase().split('')
        );
        const isWon = [...uniqueLetters].every((l) =>
          newRevealedLetters.includes(l)
        );

        // Check lose condition
        const isLost = newWrongGuesses >= MAX_ATTEMPTS;

        const newGameStatus = isWon ? 'won' : isLost ? 'lost' : 'playing';

        return {
          ...prevState,
          usedLetters: newUsedLetters,
          revealedLetters: newRevealedLetters,
          wrongGuesses: newWrongGuesses,
          gameStatus: newGameStatus
        };
      });
    } catch (err) {
      setError('Failed to validate guess. Please try again.');
      console.error('Error validating guess:', err);
    } finally {
      setIsGuessing(false);
    }
  }, [gameState.gameStatus, gameState.usedLetters, gameState.word, isGuessing]);

  const resetGame = useCallback(() => {
    setGameState(initialGameState);
    setError(null);
    setIsGuessing(false);
  }, []);

  const getCorrectLetters = useCallback(() => {
    return gameState.usedLetters.filter((letter) =>
      gameState.revealedLetters.includes(letter)
    );
  }, [gameState.usedLetters, gameState.revealedLetters]);

  const getIncorrectLetters = useCallback(() => {
    return gameState.usedLetters.filter(
      (letter) => !gameState.revealedLetters.includes(letter)
    );
  }, [gameState.usedLetters, gameState.revealedLetters]);

  return {
    gameState,
    isLoading,
    isGuessing,
    error,
    startGame,
    makeGuess,
    resetGame,
    getCorrectLetters,
    getIncorrectLetters
  };
}
