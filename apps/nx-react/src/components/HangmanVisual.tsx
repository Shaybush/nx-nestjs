import styles from './HangmanVisual.module.css';

interface HangmanVisualProps {
  wrongGuesses: number;
}

export function HangmanVisual({ wrongGuesses }: HangmanVisualProps) {
  const drawParts = [
    // 0: Head
    <circle key="head" cx="140" cy="60" r="20" stroke="#333" strokeWidth="3" fill="none" />,
    // 1: Body
    <line key="body" x1="140" y1="80" x2="140" y2="130" stroke="#333" strokeWidth="3" />,
    // 2: Left arm
    <line key="left-arm" x1="140" y1="90" x2="120" y2="110" stroke="#333" strokeWidth="3" />,
    // 3: Right arm
    <line key="right-arm" x1="140" y1="90" x2="160" y2="110" stroke="#333" strokeWidth="3" />,
    // 4: Left leg
    <line key="left-leg" x1="140" y1="130" x2="120" y2="160" stroke="#333" strokeWidth="3" />,
    // 5: Right leg
    <line key="right-leg" x1="140" y1="130" x2="160" y2="160" stroke="#333" strokeWidth="3" />
  ];

  return (
    <svg 
      viewBox="0 0 200 200" 
      preserveAspectRatio="xMidYMid meet"
      className={styles.container}
    >
      {/* Gallows base */}
      <line x1="10" y1="180" x2="70" y2="180" stroke="#8B4513" strokeWidth="4" />
      {/* Gallows pole */}
      <line x1="40" y1="180" x2="40" y2="20" stroke="#8B4513" strokeWidth="4" />
      {/* Gallows top bar */}
      <line x1="40" y1="20" x2="140" y2="20" stroke="#8B4513" strokeWidth="4" />
      {/* Rope */}
      <line x1="140" y1="20" x2="140" y2="40" stroke="#333" strokeWidth="2" />
      
      {/* Draw hangman parts based on wrong guesses */}
      {drawParts.slice(0, wrongGuesses)}
    </svg>
  );
}
