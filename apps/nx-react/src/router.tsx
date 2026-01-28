import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { SinglePlayerGame } from './pages/SinglePlayerGame';
import { TwoPlayerSetup } from './pages/TwoPlayerSetup';
import { TwoPlayerGame } from './pages/TwoPlayerGame';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Leaderboard } from './pages/Leaderboard';
import { MyScores } from './pages/MyScores';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { lazy, type ReactNode } from 'react';

const MainMenu = lazy(() =>
  import('./pages/MainMenu').then((module) => ({ default: module.MainMenu }))
);

function protect(element: ReactNode): ReactNode {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        index: true,
        element: protect(<MainMenu />),
      },
      {
        path: 'hangman',
        children: [
          {
            index: true,
            element: protect(<MainMenu />),
          },
          {
            path: 'single',
            element: protect(<SinglePlayerGame />),
          },
          {
            path: 'two-player',
            children: [
              {
                path: 'setup',
                element: protect(<TwoPlayerSetup />),
              },
              {
                path: 'game',
                element: protect(<TwoPlayerGame />),
              },
            ],
          },
        ],
      },
      {
        path: 'leaderboard',
        Component: Leaderboard,
      },
      {
        path: 'my-scores',
        element: protect(<MyScores />),
      },
      {
        path: 'login',
        Component: Login,
      },
      {
        path: 'register',
        Component: Register,
      },
    ],
  },
]);
