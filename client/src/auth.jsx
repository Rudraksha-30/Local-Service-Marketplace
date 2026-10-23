
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);
const INACTIVITY_LIMIT = 15 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    const wasLoggedIn = Boolean(getToken() || user);

    // Clear local authentication immediately.
    setToken(null);
    setUser(null);

    // Revoke the server-side refresh session and clear its cookie.
    try {
      await api.post('/auth/logout');
    } catch {
      // Local logout should still work if the server is unavailable.
    }

    if (wasLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      navigate('/login', { replace: true });
    });

    // Restore the session using the HttpOnly refresh cookie.
    let cancelled = false;

    async function restoreSession() {
      try {
        const refreshed = await api.post('/auth/refresh');

        if (cancelled) return;

        setToken(refreshed.token);

        const current = await api.get('/auth/me');

        if (!cancelled) {
          setUser(current.user);
        }
      } catch {
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
      setUnauthorizedHandler(() => {});
    };
  }, [navigate]);

  useEffect(() => {
    if (!user || !getToken()) return;

    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT);
    };

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, logout]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });

    setToken(data.token);
    setUser(data.user);

    return data.user;
  }, []);

  const register = useCallback(async (form) => {
    const data = await api.post('/auth/register', form);

    setToken(data.token);
    setUser(data.user);

    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
