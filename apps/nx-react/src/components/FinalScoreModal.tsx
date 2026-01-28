import styles from './FinalScoreModal.module.css';

interface FinalScoreModalProps {
  isOpen: boolean;
  player1Name: string;
  player1Score: number;
  player2Name: string;
  player2Score: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function FinalScoreModal({
  isOpen,
  player1Name,
  player1Score,
  player2Name,
  player2Score,
  onPlayAgain,
  onMainMenu
}: FinalScoreModalProps) {
  if (!isOpen) {
    return null;
  }

  const isPlayer1Winner = player1Score > player2Score;
  const isPlayer2Winner = player2Score > player1Score;
  const isTie = player1Score === player2Score;

  const getWinnerMessage = () => {
    if (isTie) {
      return "It's a Tie!";
    }
    return isPlayer1Winner 
      ? `${player1Name} Wins! 🏆` 
      : `${player2Name} Wins! 🏆`;
  };

  return (
    <div className={styles.overlay} onClick={onMainMenu}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>
          Game Over!
        </h2>
        
        <div className={styles.winnerAnnouncement}>
          {getWinnerMessage()}
        </div>

        <div className={styles.scoresContainer}>
          <div className={`${styles.playerScore} ${isPlayer1Winner ? styles.winner : ''}`}>
            <div className={styles.playerName}>{player1Name}</div>
            <div className={styles.score}>{player1Score}</div>
            <div className={styles.label}>points</div>
          </div>

          <div className={styles.versus}>vs</div>

          <div className={`${styles.playerScore} ${isPlayer2Winner ? styles.winner : ''}`}>
            <div className={styles.playerName}>{player2Name}</div>
            <div className={styles.score}>{player2Score}</div>
            <div className={styles.label}>points</div>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <button
            className="btn btn-success"
            onClick={onPlayAgain}
          >
            Play Again
          </button>
          
          <button
            className="btn btn-primary"
            onClick={onMainMenu}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
