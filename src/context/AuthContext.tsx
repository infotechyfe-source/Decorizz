import React from 'react';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
};

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  isLoading: boolean;
};

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  accessToken: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  googleLogin: async () => {},
  isLoading: true,
});

