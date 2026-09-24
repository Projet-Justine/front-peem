import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { disconnectSocket } from '../lib/socket';
import type { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

interface RegisterData {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  role?: string;
  matricule?: string;
  filiere?: string;
  niveau?: string;
  promotion?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('emit_token');
    const savedUser = localStorage.getItem('emit_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('emit_token');
        localStorage.removeItem('emit_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, motDePasse: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, motDePasse });
    const { accessToken, user: userData } = res.data;
    localStorage.setItem('emit_token', accessToken);
    localStorage.setItem('emit_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    const { accessToken, user: userData } = res.data;
    localStorage.setItem('emit_token', accessToken);
    localStorage.setItem('emit_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('emit_token');
    localStorage.removeItem('emit_user');
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('emit_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
