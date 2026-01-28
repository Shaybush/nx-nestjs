import { type FC } from 'react';
import styles from './Scoreboard.module.css';

interface ScoreboardProps {
  player1Name: string;
  player1Score: number;
  player2Name: string;
  player2Score: number;
  currentPlayer: 1 | 2;
  roundNumber: number;
}

export const Scoreboard: FC<ScoreboardProps> = ({
  player1Name,
  player1Score,
  player2Name,
  player2Score,
  currentPlayer,
  roundNumber,
}) => {
  const player1Active = currentPlayer === 1;
  const player2Active = currentPlayer === 2;

  return (
    <div className={styles.scoreboard}>
      <div
        className={`${styles.playerCard} ${
          player1Active ? styles.activePlayer : ''
        }`}
      >
        <div className={styles.playerName}>{player1Name}</div>
        <div className={styles.playerScore}>{player1Score}</div>
        <div className={styles.playerLabel}>Player 1</div>
      </div>

      <div className={styles.roundInfo}>
        <div className={styles.roundLabel}>Round</div>
        <div className={styles.roundNumber}>{roundNumber}</div>
      </div>

      <div
        className={`${styles.playerCard} ${
          player2Active ? styles.activePlayer : ''
        }`}
      >
        <div className={styles.playerName}>{player2Name}</div>
        <div className={styles.playerScore}>{player2Score}</div>
        <div className={styles.playerLabel}>Player 2</div>
      </div>
    </div>
  );
};
