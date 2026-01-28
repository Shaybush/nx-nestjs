import { Outlet, Link, useLocation } from 'react-router';
import { TwoPlayerProvider } from '../context/TwoPlayerContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './RootLayout.module.css';

export function RootLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  
  const authPages = ['/login', '/register'];
  const hideHeader = authPages.includes(location.pathname);

  return (
    <TwoPlayerProvider>
      <div className="app-container">
        {!hideHeader && (
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <Link to="/" className={styles.logo}>
                Hangman Game
              </Link>
              <nav className={styles.nav}>
                <button 
                  onClick={toggleTheme} 
                  className={styles.themeToggle}
                  aria-label="Toggle theme"
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
                {isAuthenticated ? (
                  <>
                    <span className={styles.username}>Welcome, {user?.username}</span>
                    <button onClick={logout} className={`btn btn-error ${styles.logoutBtn}`}>
                      Logout
                    </button>
                  </>
                ) : (
                  <div className={styles.authLinks}>
                    <Link to="/login" className={`btn btn-primary ${styles.authBtn}`}>
                      Login
                    </Link>
                    <Link to="/register" className={`btn btn-success ${styles.authBtn}`}>
                      Register
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </header>
        )}
        <Outlet />
      </div>
    </TwoPlayerProvider>
  );
}
