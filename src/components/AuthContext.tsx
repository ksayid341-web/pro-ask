import React, { createContext, useContext, useState } from 'react';
import { UserData } from '../App';

interface AuthContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('user_session');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setUser = (userData: UserData | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem('user_session', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user_session');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
