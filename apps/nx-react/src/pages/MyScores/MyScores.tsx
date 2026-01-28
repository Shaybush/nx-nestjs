import { useState, useEffect } from "react";
import { Link } from "react-router";
import { apiGet } from "../../api/client";
import type { GameScore, ApiResponse } from "@nx-shay/shared";
import styles from "./MyScores.module.css";

export function MyScores() {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: ApiResponse<GameScore[]> = await apiGet("/api/scores/me");
      setScores(response.data);
    } catch (err) {
      setError("Failed to load your scores. Please try again later.");
      console.error("Error fetching scores:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return minutes + "m " + remainingSeconds + "s";
    }
    return remainingSeconds + "s";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Scores</h1>
        <Link to="/hangman" className="btn btn-primary">
          Back to Menu
        </Link>
      </div>

      {isLoading && (
        <div className={styles.loadingContainer}>Loading...</div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchScores} className="btn btn-primary">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && scores.length === 0 && (
        <div className={styles.emptyState}>
          <p>You haven't played any games yet.</p>
          <Link to="/hangman/single" className="btn btn-primary">
            Play Now
          </Link>
        </div>
      )}

      {!isLoading && !error && scores.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Word</th>
                <th>Guesses</th>
                <th>Result</th>
                <th>Mode</th>
                <th>Duration</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => (
                <tr key={score.id}>
                  <td className={styles.word}>{score.word}</td>
                  <td>{score.guessesUsed}</td>
                  <td>
                    <span
                      className={
                        score.won ? styles.resultWin : styles.resultLoss
                      }
                    >
                      {score.won ? "Won" : "Lost"}
                    </span>
                  </td>
                  <td className={styles.mode}>
                    {score.gameMode === "single" ? "Single Player" : "Two Player"}
                  </td>
                  <td>{formatDuration(score.duration)}</td>
                  <td className={styles.date}>{formatDate(score.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
