import styles from './LetterKeyboard.module.css';

interface LetterKeyboardProps {
  usedLetters: string[];
  onGuess: (letter: string) => void;
  disabled: boolean;
  correctLetters?: string[];
}

export function LetterKeyboard({ 
  usedLetters, 
  onGuess, 
  disabled,
  correctLetters = []
}: LetterKeyboardProps) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const getButtonClassName = (letter: string): string => {
    const isUsed = usedLetters.includes(letter.toLowerCase());
    const isCorrect = correctLetters.includes(letter.toLowerCase());
    
    const classes = [styles.button];
    
    if (disabled && !isUsed) {
      classes.push(styles.buttonDisabled);
    } else if (isUsed) {
      classes.push(styles.buttonUsed);
      if (isCorrect) {
        classes.push(styles.buttonCorrect);
      } else {
        classes.push(styles.buttonIncorrect);
      }
    }
    
    return classes.join(' ');
  };

  return (
    <div className={styles.container}>
      {alphabet.map((letter) => {
        const isUsed = usedLetters.includes(letter.toLowerCase());
        return (
          <button
            key={letter}
            onClick={() => onGuess(letter.toLowerCase())}
            disabled={disabled || isUsed}
            className={getButtonClassName(letter)}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
