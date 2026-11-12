import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrbitDB } from '../lib/orbitDB';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  allUsers: UserProfile[];
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  signup: (fullName: string, email: string, pass: string) => Promise<UserProfile>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncState = () => {
    const current = OrbitDB.getActiveUser();
    setUser(current);
    setAllUsers(OrbitDB.getUsers());
    setIsLoading(false);
  };

  useEffect(() => {
    syncState();
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = OrbitDB.loginUser(email, pass);
      syncState();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, pass: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = OrbitDB.registerUser(fullName, email, pass);
      syncState();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    OrbitDB.logoutUser();
    syncState();
  };

  const switchUser = (userId: string) => {
    OrbitDB.switchUser(userId);
    syncState();
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = OrbitDB.updateProfile(user.id, data);
    setUser(updated);
    setAllUsers(OrbitDB.getUsers());
  };

  const refreshUser = () => {
    syncState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        signup,
        logout,
        switchUser,
        updateProfile,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
