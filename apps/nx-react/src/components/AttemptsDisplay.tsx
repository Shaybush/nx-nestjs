import styles from './AttemptsDisplay.module.css';

interface AttemptsDisplayProps {
  remaining: number;
  max: number;
}

export function AttemptsDisplay({ remaining, max }: AttemptsDisplayProps) {
  const percentage = (remaining / max) * 100;
  
  const getStatusClass = () => {
    if (percentage > 60) return styles.statusGood;
    if (percentage > 30) return styles.statusWarning;
    return styles.statusDanger;
  };

  const getColor = () => {
    if (percentage > 60) return 'var(--color-success)';
    if (percentage > 30) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.text} ${getStatusClass()}`}>
        Attempts Remaining: {remaining} / {max}
      </div>
      <div className={styles.progressBarContainer}>
        <div 
          className={styles.progressBar}
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor()
          }}
        />
      </div>
    </div>
  );
}
