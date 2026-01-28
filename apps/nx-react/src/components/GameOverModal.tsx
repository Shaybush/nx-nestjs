import styles from './GameOverModal.module.css';

interface GameOverModalProps {
  isOpen: boolean;
  isWin: boolean;
  word: string;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export function GameOverModal({
  isOpen,
  isWin,
  word,
  onPlayAgain,
  onReturnToMenu
}: GameOverModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onReturnToMenu}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={`${styles.title} ${isWin ? styles.titleWin : styles.titleLose}`}>
          {isWin ? 'You Won!' : 'Game Over!'}
        </h2>
        
        <p className={styles.word}>
          The word was: <strong>{word}</strong>
        </p>

        <div className={styles.buttonContainer}>
          <button
            className="btn btn-success"
            onClick={onPlayAgain}
          >
            Play Again
          </button>
          
          <button
            className="btn btn-primary"
            onClick={onReturnToMenu}
          >
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
