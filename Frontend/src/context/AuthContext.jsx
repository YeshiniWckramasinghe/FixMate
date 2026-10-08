import { createContext, useContext, useState, useCallback } from 'react';
import client, { apiErrorMessage } from '../api/client';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('fixmate_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser());
  const [token, setToken] = useState(localStorage.getItem('fixmate_token'));

  const persist = (authResponse) => {
    const { token: newToken, ...userInfo } = authResponse;
    localStorage.setItem('fixmate_token', newToken);
    localStorage.setItem('fixmate_user', JSON.stringify(userInfo));
    setToken(newToken);
    setUser(userInfo);
  };

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await client.post('/api/auth/login', { email, password });
      persist(data);
      return { success: true, role: data.role };
    } catch (error) {
      return { success: false, message: apiErrorMessage(error) };
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const { data } = await client.post('/api/auth/register', payload);
      persist(data);
      return { success: true, role: data.role };
    } catch (error) {
      return { success: false, message: apiErrorMessage(error) };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fixmate_token');
    localStorage.removeItem('fixmate_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
