import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TwoPlayerState, Player } from '../types';

interface TwoPlayerContextValue {
  state: TwoPlayerState;
  setPlayerNames: (player1Name: string, player2Name: string) => void;
  incrementScore: (player: 1 | 2) => void;
  switchPlayer: () => void;
  incrementRound: () => void;
  resetGame: () => void;
}

const TwoPlayerContext = createContext<TwoPlayerContextValue | null>(null);

const initialPlayer1: Player = {
  name: 'Player 1',
  score: 0,
};

const initialPlayer2: Player = {
  name: 'Player 2',
  score: 0,
};

const initialState: TwoPlayerState = {
  player1: initialPlayer1,
  player2: initialPlayer2,
  currentPlayer: 1,
  roundNumber: 1,
};

interface TwoPlayerProviderProps {
  children: ReactNode;
}

export function TwoPlayerProvider(props: TwoPlayerProviderProps) {
  const { children } = props;
  const [state, setState] = useState<TwoPlayerState>(initialState);

  const setPlayerNames = useCallback((player1Name: string, player2Name: string) => {
    setState((prev) => ({
      ...prev,
      player1: { ...prev.player1, name: player1Name || 'Player 1' },
      player2: { ...prev.player2, name: player2Name || 'Player 2' },
    }));
  }, []);

  const incrementScore = useCallback((player: 1 | 2) => {
    setState((prev) => {
      const playerKey = player === 1 ? 'player1' : 'player2';
      return {
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          score: prev[playerKey].score + 1,
        },
      };
    });
  }, []);

  const switchPlayer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
    }));
  }, []);

  const incrementRound = useCallback(() => {
    setState((prev) => ({
      ...prev,
      roundNumber: prev.roundNumber + 1,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState);
  }, []);

  const value: TwoPlayerContextValue = {
    state,
    setPlayerNames,
    incrementScore,
    switchPlayer,
    incrementRound,
    resetGame,
  };

  return (
    <TwoPlayerContext.Provider value={value}>
      {children}
    </TwoPlayerContext.Provider>
  );
}

export function useTwoPlayerContext() {
  const context = useContext(TwoPlayerContext);
  if (!context) {
    throw new Error('useTwoPlayerContext must be used within TwoPlayerProvider');
  }
  return context;
}
