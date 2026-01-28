const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function getRandomWord(): Promise<{ word: string; length: number }> {
  const res = await fetch(`${API_BASE}/hangman/word`);
  if (!res.ok) {
    throw new Error('Failed to fetch word');
  }
  const json = await res.json();
  return json.data;
}

export async function validateGuess(
  word: string,
  guess: string
): Promise<{ isCorrect: boolean; positions: number[] }> {
  const res = await fetch(`${API_BASE}/hangman/validate-guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, guess })
  });
  if (!res.ok) {
    throw new Error('Failed to validate guess');
  }
  const json = await res.json();
  return json.data;
}
