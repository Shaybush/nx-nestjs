import { useEffect, useCallback } from 'react';

interface UseKeyboardInputOptions {
  onKeyPress: (letter: string) => void;
  disabled: boolean;
}

/**
 * Custom hook to handle keyboard input for the Hangman game
 * Listens for A-Z key presses and calls the callback with the pressed letter
 * 
 * @param onKeyPress - Callback function to handle letter input
 * @param disabled - When true, keyboard input is ignored
 */
export function useKeyboardInput({ onKeyPress, disabled }: UseKeyboardInputOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if disabled
      if (disabled) {
        return;
      }

      // Only handle letter keys (A-Z)
      const key = event.key.toUpperCase();
      
      // Check if key is a single letter A-Z
      if (key.length === 1 && key >= 'A' && key <= 'Z') {
        // Prevent default behavior (like scrolling with space)
        event.preventDefault();
        
        // Call the callback with lowercase letter
        onKeyPress(key.toLowerCase());
      }
    },
    [onKeyPress, disabled]
  );

  useEffect(() => {
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount or when dependencies change
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
