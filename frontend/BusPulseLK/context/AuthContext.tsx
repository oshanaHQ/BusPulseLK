import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../services/api';

// Re-export so other files can import from here too
export type { AuthUser } from '../services/api';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;   // true while reading AsyncStorage on startup
  isGuest: boolean;     // true when logged in as guest (in-memory only)
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: AuthUser) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const TOKEN_KEY = 'buspulse_token';
const USER_KEY  = 'buspulse_user';

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isGuest: false,
  });

  // Restore session on app startup
  useEffect(() => {
    (async () => {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (token && userJson) {
          setState({ token, user: JSON.parse(userJson), isLoading: false, isGuest: false });
        } else {
          setState({ token: null, user: null, isLoading: false, isGuest: false });
        }
      } catch {
        setState({ token: null, user: null, isLoading: false, isGuest: false });
      }
    })();
  }, []);

  // Save token + user and update state
  const login = async (token: string, user: AuthUser) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
    setState({ token, user, isLoading: false, isGuest: false });
  };

  // Guest login — in-memory only, not persisted to AsyncStorage
  const loginAsGuest = () => {
    const guestNumber = Math.floor(1000 + Math.random() * 9000);
    const guestUser: AuthUser = {
      id: -1,
      fullName: `Guest#${guestNumber}`,
      email: '',
      role: 'Passenger',
    };
    setState({ token: 'guest', user: guestUser, isLoading: false, isGuest: true });
  };

  // Clear everything
  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setState({ token: null, user: null, isLoading: false, isGuest: false });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.token,
        login,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
