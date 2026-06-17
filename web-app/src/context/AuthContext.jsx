// Web port of the mobile app's AuthContext (src/context/AuthContext.tsx)
import { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, signupUser, googleSignIn, verifyToken } from '../services/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token on app launch
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        const response = await verifyToken(storedToken);
        if (response.success) {
          setToken(storedToken);
          setUser(response.user);
        } else {
          localStorage.removeItem('auth_token');
        }
      }
    } catch {
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await loginUser(email, password);
    if (response.success) {
      localStorage.setItem('auth_token', response.token);
      setToken(response.token);
      setUser(response.user);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const signup = async (name, email, phone, password) => {
    const response = await signupUser(name, email, phone, password);
    if (response.success) {
      localStorage.setItem('auth_token', response.token);
      setToken(response.token);
      setUser(response.user);
    } else {
      throw new Error(response.error || 'Signup failed');
    }
  };

  const googleLogin = async (idToken) => {
    const response = await googleSignIn(idToken);
    if (response.success) {
      localStorage.setItem('auth_token', response.token);
      setToken(response.token);
      setUser(response.user);
    } else {
      throw new Error(response.error || 'Google sign-in failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    googleLogin,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
