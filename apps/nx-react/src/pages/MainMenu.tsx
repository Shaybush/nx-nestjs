import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import styles from "./MainMenu.module.css";

export function MainMenu() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hangman</h1>
      <div className={styles.buttonGroup}>
        <Link to="/hangman/single" className="btn btn-primary">
          Single Player
        </Link>
        <Link to="/hangman/two-player/setup" className="btn btn-primary">
          Two Player
        </Link>
        <Link to="/leaderboard" className="btn btn-primary">
          Leaderboard
        </Link>
        {isAuthenticated && (
          <Link to="/my-scores" className="btn btn-primary">
            My Scores
          </Link>
        )}
      </div>
    </div>
  );
}
