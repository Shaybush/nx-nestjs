import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useHangmanGame } from "../hooks/useHangmanGame";
import { useKeyboardInput } from "../hooks/useKeyboardInput";
import { useAuth } from "../context/AuthContext";
import { apiPost } from "../api/client";
import { HangmanVisual } from "../components/HangmanVisual";
import { WordDisplay } from "../components/WordDisplay";
import { LetterKeyboard } from "../components/LetterKeyboard";
import { AttemptsDisplay } from "../components/AttemptsDisplay";
import { GameOverModal } from "../components/GameOverModal";
import styles from "./SinglePlayerGame.module.css";

export function SinglePlayerGame() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    gameState,
    isLoading,
    isGuessing,
    error,
    startGame,
    makeGuess,
    resetGame,
  } = useHangmanGame();

  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const hasSubmittedScore = useRef(false);

  useEffect(() => {
    startGame();
    setGameStartTime(Date.now());
    hasSubmittedScore.current = false;
  }, [startGame]);

  // Submit score when game ends
  useEffect(() => {
    const submitScore = async () => {
      if (
        !isAuthenticated ||
        hasSubmittedScore.current ||
        gameState.gameStatus === "playing" ||
        !gameStartTime
      ) {
        return;
      }

      hasSubmittedScore.current = true;

      try {
        const duration = Math.floor((Date.now() - gameStartTime) / 1000);
        const guessesUsed = gameState.wrongGuesses;
        const won = gameState.gameStatus === "won";

        await apiPost("/api/scores", {
          word: gameState.word,
          guessesUsed,
          won,
          gameMode: "single",
          duration,
        });
      } catch (error) {
        console.error("Failed to submit score:", error);
        // Don't block game flow on error
      }
    };

    if (gameState.gameStatus !== "playing") {
      submitScore();
    }
  }, [
    gameState.gameStatus,
    gameState.word,
    gameState.wrongGuesses,
    gameStartTime,
    isAuthenticated,
  ]);

  const handlePlayAgain = () => {
    resetGame();
    setGameStartTime(Date.now());
    hasSubmittedScore.current = false;
    startGame();
  };

  const handleReturnToMenu = () => {
    navigate("/hangman");
  };

  const isGameOver = gameState.gameStatus !== "playing";

  // Enable keyboard input when game is active and not guessing
  useKeyboardInput({
    onKeyPress: makeGuess,
    disabled: isGameOver || isLoading || isGuessing,
  });

  if (isLoading) {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={handlePlayAgain} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const remainingAttempts = gameState.maxAttempts - gameState.wrongGuesses;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Single Player</h1>

      <div className={styles.gameArea}>
        <HangmanVisual wrongGuesses={gameState.wrongGuesses} />

        {gameState.word && (
          <>
            <WordDisplay
              word={gameState.word}
              revealedLetters={gameState.revealedLetters}
            />

            <AttemptsDisplay
              remaining={remainingAttempts}
              max={gameState.maxAttempts}
            />

            <LetterKeyboard
              usedLetters={gameState.usedLetters}
              correctLetters={gameState.revealedLetters}
              onGuess={makeGuess}
              disabled={isGameOver || isGuessing}
            />

            {isGuessing && (
              <div className={styles.checkingIndicator}>Checking...</div>
            )}
          </>
        )}
      </div>

      <GameOverModal
        isOpen={isGameOver}
        isWin={gameState.gameStatus === "won"}
        word={gameState.word}
        onPlayAgain={handlePlayAgain}
        onReturnToMenu={handleReturnToMenu}
      />
    </div>
  );
}
