import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawUser = localStorage.getItem('voicecare_user');
    const token = localStorage.getItem('voicecare_token');

    if (rawUser && token) {
      try {
        setUser(JSON.parse(rawUser));
      } catch {
        localStorage.removeItem('voicecare_user');
        localStorage.removeItem('voicecare_token');
      }
    }

    setLoading(false);
  }, []);

  const login = async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    const nextUser = data.doctor;

    localStorage.setItem('voicecare_user', JSON.stringify(nextUser));
    localStorage.setItem('voicecare_token', data.token);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    const nextUser = data.doctor;

    localStorage.setItem('voicecare_user', JSON.stringify(nextUser));
    localStorage.setItem('voicecare_token', data.token);
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    localStorage.removeItem('voicecare_user');
    localStorage.removeItem('voicecare_token');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
