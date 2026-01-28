import styles from './UsedLetters.module.css';

interface UsedLettersProps {
  correct: string[];
  incorrect: string[];
}

export function UsedLetters({ correct, incorrect }: UsedLettersProps) {
  if (correct.length === 0 && incorrect.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {correct.length > 0 && (
        <div className={styles.section}>
          <h3 className={`${styles.heading} ${styles.headingCorrect}`}>
            Correct Guesses
          </h3>
          <div className={styles.letterList}>
            {correct.map((letter) => (
              <span
                key={letter}
                className={`${styles.letter} ${styles.letterCorrect}`}
              >
                {letter.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {incorrect.length > 0 && (
        <div className={styles.section}>
          <h3 className={`${styles.heading} ${styles.headingIncorrect}`}>
            Incorrect Guesses
          </h3>
          <div className={styles.letterList}>
            {incorrect.map((letter) => (
              <span
                key={letter}
                className={`${styles.letter} ${styles.letterIncorrect}`}
              >
                {letter.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
