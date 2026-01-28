import { useState, useEffect } from "react";
import { Link } from "react-router";
import { apiGet } from "../../api/client";
import type { LeaderboardEntry, ApiResponse } from "@nx-shay/shared";
import styles from "./Leaderboard.module.css";

type GameModeFilter = "all" | "single" | "two";

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<GameModeFilter>("all");

  useEffect(() => {
    fetchLeaderboard();
  }, [modeFilter]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url =
        modeFilter === "all"
          ? "/api/leaderboard"
          : "/api/leaderboard?mode=" + modeFilter;
      const response: ApiResponse<LeaderboardEntry[]> = await apiGet(url);
      setLeaderboard(response.data);
    } catch (err) {
      setError("Failed to load leaderboard. Please try again later.");
      console.error("Error fetching leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Leaderboard</h1>
        <Link to="/hangman" className="btn btn-primary">
          Back to Menu
        </Link>
      </div>

      <div className={styles.filters}>
        <button
          className={styles.filterButton + " " + (modeFilter === "all" ? styles.active : "")}
          onClick={() => setModeFilter("all")}
        >
          All Games
        </button>
        <button
          className={styles.filterButton + " " + (modeFilter === "single" ? styles.active : "")}
          onClick={() => setModeFilter("single")}
        >
          Single Player
        </button>
        <button
          className={styles.filterButton + " " + (modeFilter === "two" ? styles.active : "")}
          onClick={() => setModeFilter("two")}
        >
          Two Player
        </button>
      </div>

      {isLoading && (
        <div className={styles.loadingContainer}>Loading...</div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchLeaderboard} className="btn btn-primary">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && leaderboard.length === 0 && (
        <div className={styles.emptyState}>
          <p>No scores yet. Be the first to play!</p>
        </div>
      )}

      {!isLoading && !error && leaderboard.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Wins</th>
                <th>Total Games</th>
                <th>Avg Guesses</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.rank}>
                  <td className={styles.rank}>
                    {entry.rank === 1 && <span className={styles.trophy}>🥇</span>}
                    {entry.rank === 2 && <span className={styles.trophy}>🥈</span>}
                    {entry.rank === 3 && <span className={styles.trophy}>🥉</span>}
                    {entry.rank > 3 && entry.rank}
                  </td>
                  <td className={styles.username}>{entry.username}</td>
                  <td>{entry.wins}</td>
                  <td>{entry.totalGames}</td>
                  <td>{entry.avgGuesses.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
