# Dark Mode & Color Palette Plan

## Summary

Add dark mode toggle to the React app using a CSS class on `<html>`, a React context for state, and localStorage persistence. Reuse existing CSS variables — override them under `.dark` class. No new colors introduced.

---

### Phase 1: Theme Context & CSS Variable Overrides

**Assigned to**: frontend-engineer
**Date Started**: 2026-01-29
**Status**: [ ] Not Started | [ ] In Progress | [x] Completed

- [x] Create `src/context/ThemeContext.tsx` with React context providing `{ theme, toggleTheme }`
  - Default to `localStorage.getItem('theme')` or `'light'`
  - On toggle: flip theme, persist to localStorage, set/remove `.dark` class on `document.documentElement`
- [x] Add `.dark` overrides in `index.css` under `:root.dark` selector — invert backgrounds/text using existing palette vars:
  - `--color-text: #e0e0e0` (was `--color-bg-light`)
  - `--color-text-light: #ccc` (was `--color-bg-disabled`)
  - `--color-border: #e0e0e0`
  - `--color-bg-light: #333` (was `--color-text`)
  - `--color-bg-disabled: #555`
  - `--color-white: #1a1a2e` (dark surface)
  - `--color-overlay: rgba(0, 0, 0, 0.8)`
  - `--gradient-menu: linear-gradient(135deg, #3a3d7c 0%, #4a2d6b 100%)` (darker version of existing purple)
- [x] Wrap app with `<ThemeProvider>` in `main.tsx` (alongside existing `AuthProvider`)

#### Phase 1 Completion Report

| Question                                 | Response |
| ---------------------------------------- | -------- |
| What was implemented?                    | ThemeContext with localStorage + prefers-color-scheme, :root.dark CSS overrides, ThemeProvider in main.tsx |
| Were there any deviations from the plan? | No |
| Issues/blockers encountered?             | None |
| How were issues resolved?                | N/A |
| Any technical debt introduced?           | None |
| Recommendations for next phase?          | Wire up toggle button in header and audit CSS modules for hardcoded colors |

**Completed by**: frontend-engineer
**Date Completed**: 2026-01-29

#### Notes for Future Phases

- **New files**: `src/context/ThemeContext.tsx`
- **Modified files**: `index.css`, `main.tsx`

---

### Phase 2: Toggle UI & Component Adjustments

**Assigned to**: frontend-engineer
**Date Started**: 2026-01-29
**Status**: [ ] Not Started | [ ] In Progress | [x] Completed

- [x] Add dark mode toggle button in `RootLayout.tsx` header (moon/sun emoji toggle)
- [x] Update hardcoded colors in CSS modules that don't use CSS variables:
  - `RootLayout.module.css` — header background dark override
  - `Leaderboard.module.css` / `MyScores.module.css` — table backgrounds, borders, hover states
  - `Scoreboard.module.css` — active player gradient and shadows
  - `FinalScoreModal.module.css` — winner highlight background
  - `AttemptsDisplay.module.css` — progress bar background
  - `TwoPlayerSetup.module.css` — card shadow and input borders
  - `TwoPlayerGame.module.css` — player banner shadow
  - Login/Register, GameOverModal, RoundTransition — already compatible, verified
- [x] Verify all pages render correctly in both modes
- [x] Verified `prefers-color-scheme` already handled in ThemeContext getInitialTheme

#### Phase 2 Completion Report

| Question                                 | Response |
| ---------------------------------------- | -------- |
| What was implemented?                    | Toggle button in header, dark mode CSS overrides in 9 CSS modules, verified system theme detection |
| Were there any deviations from the plan? | Login/Register CSS needed no changes — already used CSS variables properly |
| Issues/blockers encountered?             | None |
| How were issues resolved?                | N/A |
| Any technical debt introduced?           | `--color-white` variable holds dark value in dark mode (semantic mismatch, acceptable trade-off) |
| Recommendations for next phase?          | N/A — dark mode implementation complete |

**Completed by**: frontend-engineer
**Date Completed**: 2026-01-29

#### Notes for Future Phases

- **Modified files**: `RootLayout.tsx`, `RootLayout.module.css`, multiple CSS modules
- **No new dependencies** — pure CSS + React context
