import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTwoPlayerContext } from '../context/TwoPlayerContext';
import styles from './TwoPlayerSetup.module.css';

export function TwoPlayerSetup() {
  const navigate = useNavigate();
  const { setPlayerNames } = useTwoPlayerContext();
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');

  const handleStartGame = () => {
    setPlayerNames(
      player1Name.trim() || 'Player 1',
      player2Name.trim() || 'Player 2'
    );
    navigate('/hangman/two-player/game');
  };

  const handleBackToMenu = () => {
    navigate('/hangman');
  };

  return (
    <div className={styles.container}>
      <div className={styles.setupCard}>
        <h1 className={styles.title}>Two Player Setup</h1>
        
        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="player1" className={styles.label}>
              Player 1 Name:
            </label>
            <input
              id="player1"
              type="text"
              className={styles.input}
              placeholder="Player 1"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="player2" className={styles.label}>
              Player 2 Name:
            </label>
            <input
              id="player2"
              type="text"
              className={styles.input}
              placeholder="Player 2"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className="btn btn-error"
              onClick={handleBackToMenu}
            >
              Back
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleStartGame}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
