import styles from './WordDisplay.module.css';

interface WordDisplayProps {
  word: string;
  revealedLetters: string[];
}

export function WordDisplay({ word, revealedLetters }: WordDisplayProps) {
  const displayWord = word
    .split('')
    .map((letter) => (revealedLetters.includes(letter.toLowerCase()) ? letter : '_'))
    .join(' ');

  return (
    <div className={styles.container}>
      {displayWord || '_ '.repeat(word.length).trim()}
    </div>
  );
}
