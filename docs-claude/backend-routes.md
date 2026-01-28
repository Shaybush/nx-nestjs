# Backend Routes — nx-nest

Global prefix: `/api`

## Auth (`/api/auth`)
- `POST /api/auth/register` — register new user (body: `RegisterRequest`) returns `{ user, tokens }`
- `POST /api/auth/login` — login (body: `LoginRequest`) returns `{ user, tokens }`
- `POST /api/auth/refresh` — refresh access token (body: `{ refreshToken }`) returns `{ accessToken }`

## Users (`/api/users`)
- `GET /api/users/me` — get current user (requires JWT Bearer token) returns `User`

## Scores (`/api/scores`)
- `POST /api/scores` — submit game score (requires JWT). Body: `{ word, guessesUsed, won, gameMode, duration }`
- `GET /api/scores/me` — current user's game history (requires JWT)
- `GET /api/leaderboard` — public leaderboard. Optional query: `?mode=single|two`

## Hangman (`/api/hangman`)
- `GET /api/hangman/word` — random word for hangman game. Returns `{ data: { word, length } }`
- `POST /api/hangman/validate-guess` — check letter guess. Body: `{ word, guess }`. Returns `{ data: { isCorrect, positions } }`

## App
- `GET /api` — health/hello endpoint
