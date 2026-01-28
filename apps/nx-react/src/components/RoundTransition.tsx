import styles from './RoundTransition.module.css';

interface RoundTransitionProps {
  isOpen: boolean;
  previousPlayerWon: boolean;
  previousPlayerName: string;
  nextPlayerName: string;
  word: string;
  onContinue: () => void;
}

export function RoundTransition({
  isOpen,
  previousPlayerWon,
  previousPlayerName,
  nextPlayerName,
  word,
  onContinue
}: RoundTransitionProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={`${styles.title} ${previousPlayerWon ? styles.titleWin : styles.titleLose}`}>
          {previousPlayerWon ? `${previousPlayerName} Won!` : `${previousPlayerName} Lost!`}
        </h2>
        
        <p className={styles.word}>
          The word was: <strong>{word}</strong>
        </p>

        <div className={styles.nextPlayerContainer}>
          <h3 className={styles.nextPlayerTitle}>
            {nextPlayerName}'s Turn!
          </h3>
          <p className={styles.nextPlayerText}>
            Get ready to guess your word
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
