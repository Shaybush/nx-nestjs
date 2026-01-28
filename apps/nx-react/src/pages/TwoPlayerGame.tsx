import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useHangmanGame } from "../hooks/useHangmanGame";
import { useKeyboardInput } from "../hooks/useKeyboardInput";
import { useTwoPlayerContext } from "../context/TwoPlayerContext";
import { useAuth } from "../context/AuthContext";
import { apiPost } from "../api/client";
import { HangmanVisual } from "../components/HangmanVisual";
import { WordDisplay } from "../components/WordDisplay";
import { LetterKeyboard } from "../components/LetterKeyboard";
import { AttemptsDisplay } from "../components/AttemptsDisplay";
import { Scoreboard } from "../components/Scoreboard";
import { RoundTransition } from "../components/RoundTransition";
import { FinalScoreModal } from "../components/FinalScoreModal";
import styles from "./TwoPlayerGame.module.css";

type GamePhase = "playing" | "transition" | "ended";

export function TwoPlayerGame() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    state: twoPlayerState,
    incrementScore,
    switchPlayer,
    incrementRound,
    resetGame: resetTwoPlayerGame,
  } = useTwoPlayerContext();

  const {
    gameState,
    isLoading,
    isGuessing,
    error,
    startGame,
    makeGuess,
    resetGame: resetHangmanGame,
  } = useHangmanGame();

  const [gamePhase, setGamePhase] = useState<GamePhase>("playing");
  const [previousResult, setPreviousResult] = useState<{
    won: boolean;
    playerName: string;
    word: string;
  } | null>(null);
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
  const hasSubmittedRoundScore = useRef(false);

  // Start game on mount
  useEffect(() => {
    startGame();
    setRoundStartTime(Date.now());
    hasSubmittedRoundScore.current = false;
  }, [startGame]);

  // Handle round end (win or lose)
  useEffect(() => {
    if (gameState.gameStatus === "won" || gameState.gameStatus === "lost") {
      const currentPlayerName =
        twoPlayerState.currentPlayer === 1
          ? twoPlayerState.player1.name
          : twoPlayerState.player2.name;

      // Award point if won
      if (gameState.gameStatus === "won") {
        incrementScore(twoPlayerState.currentPlayer);
      }

      // Store result for transition screen
      setPreviousResult({
        won: gameState.gameStatus === "won",
        playerName: currentPlayerName,
        word: gameState.word,
      });

      // Submit score to backend
      submitRoundScore(gameState.gameStatus === "won");

      // Show transition
      setGamePhase("transition");
    }
  }, [
    gameState.gameStatus,
    gameState.word,
    twoPlayerState.currentPlayer,
    twoPlayerState.player1.name,
    twoPlayerState.player2.name,
    incrementScore,
  ]);

  const submitRoundScore = async (won: boolean) => {
    if (
      !isAuthenticated ||
      hasSubmittedRoundScore.current ||
      !roundStartTime
    ) {
      return;
    }

    hasSubmittedRoundScore.current = true;

    try {
      const duration = Math.floor((Date.now() - roundStartTime) / 1000);
      const guessesUsed = gameState.wrongGuesses;

      await apiPost("/api/scores", {
        word: gameState.word,
        guessesUsed,
        won,
        gameMode: "two",
        duration,
      });
    } catch (error) {
      console.error("Failed to submit score:", error);
      // Don't block game flow on error
    }
  };

  const handleContinue = () => {
    // Switch to next player
    switchPlayer();
    incrementRound();

    // Reset hangman game and start new round
    resetHangmanGame();
    setRoundStartTime(Date.now());
    hasSubmittedRoundScore.current = false;
    startGame();

    // Return to playing phase
    setGamePhase("playing");
    setPreviousResult(null);
  };

  const handleEndGame = () => {
    setGamePhase("ended");
  };

  const handlePlayAgain = () => {
    resetTwoPlayerGame();
    navigate("/hangman/two-player/setup");
  };

  const handleMainMenu = () => {
    resetTwoPlayerGame();
    navigate("/hangman");
  };

  const getCurrentPlayerName = () => {
    return twoPlayerState.currentPlayer === 1
      ? twoPlayerState.player1.name
      : twoPlayerState.player2.name;
  };

  const getNextPlayerName = () => {
    return twoPlayerState.currentPlayer === 1
      ? twoPlayerState.player2.name
      : twoPlayerState.player1.name;
  };

  const isRoundOver = gameState.gameStatus !== "playing";

  // Enable keyboard input when round is active and not guessing
  useKeyboardInput({
    onKeyPress: makeGuess,
    disabled: isRoundOver || isLoading || gamePhase !== "playing" || isGuessing,
  });

  if (isLoading) {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button
          onClick={() => {
            resetHangmanGame();
            setRoundStartTime(Date.now());
            hasSubmittedRoundScore.current = false;
            startGame();
          }}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  const remainingAttempts = gameState.maxAttempts - gameState.wrongGuesses;

  return (
    <div className={styles.container}>
      <Scoreboard
        player1Name={twoPlayerState.player1.name}
        player1Score={twoPlayerState.player1.score}
        player2Name={twoPlayerState.player2.name}
        player2Score={twoPlayerState.player2.score}
        currentPlayer={twoPlayerState.currentPlayer}
        roundNumber={twoPlayerState.roundNumber}
      />

      <div className={styles.currentPlayerBanner}>
        <span className={styles.currentPlayerLabel}>Now Playing:</span>
        <span className={styles.currentPlayerName}>
          {getCurrentPlayerName()}
        </span>
      </div>

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
              disabled={isRoundOver || isGuessing}
            />

            {isGuessing && (
              <div className={styles.checkingIndicator}>Checking...</div>
            )}
          </>
        )}
      </div>

      <div className={styles.endGameContainer}>
        <button className="btn btn-error" onClick={handleEndGame}>
          End Game
        </button>
      </div>

      {/* Round Transition Modal */}
      {previousResult && (
        <RoundTransition
          isOpen={gamePhase === "transition"}
          previousPlayerWon={previousResult.won}
          previousPlayerName={previousResult.playerName}
          nextPlayerName={getNextPlayerName()}
          word={previousResult.word}
          onContinue={handleContinue}
        />
      )}

      {/* Final Score Modal */}
      <FinalScoreModal
        isOpen={gamePhase === "ended"}
        player1Name={twoPlayerState.player1.name}
        player1Score={twoPlayerState.player1.score}
        player2Name={twoPlayerState.player2.name}
        player2Score={twoPlayerState.player2.score}
        onPlayAgain={handlePlayAgain}
        onMainMenu={handleMainMenu}
      />
    </div>
  );
}
