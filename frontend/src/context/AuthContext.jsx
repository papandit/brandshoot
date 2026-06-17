import { createContext, useContext, useEffect, useState } from 'react';
import {
  loginUser,
  signupUser,
  googleSignIn,
  verifyToken,
} from '../user/services/api';

// The two original apps read different localStorage keys:
//   - user app  -> 'auth_token'
//   - admin app -> 'adminToken'
// We write the SAME token to both so each app's existing service layer keeps
// working unchanged behind this single, shared auth.
const TOKEN_KEYS = ['auth_token', 'adminToken'];

function setStoredToken(token) {
  TOKEN_KEYS.forEach((k) => localStorage.setItem(k, token));
}
function clearStoredToken() {
  TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
}
function getStoredToken() {
  return localStorage.getItem('auth_token');
}

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from a stored token on launch.
  useEffect(() => {
    (async () => {
      const stored = getStoredToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const res = await verifyToken(stored);
        if (res.success) {
          setToken(stored);
          setUser(res.user);
        } else {
          clearStoredToken();
        }
      } catch {
        clearStoredToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // One login for everyone; the returned role decides the destination.
  const login = async (email, password) => {
    const res = await loginUser(email, password);
    if (res.success) {
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return { success: true, role: res.user?.role || 'user' };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const signup = async (name, email, phone, password) => {
    const res = await signupUser(name, email, phone, password);
    if (res.success) {
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return { success: true, role: res.user?.role || 'user' };
    }
    return { success: false, error: res.error || 'Signup failed' };
  };

  const googleLogin = async (idToken) => {
    const res = await googleSignIn(idToken);
    if (res.success) {
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return { success: true, role: res.user?.role || 'user' };
    }
    return { success: false, error: res.error || 'Google sign-in failed' };
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => setUser((prev) => ({ ...prev, ...updated }));

  const value = {
    user,
    token,
    // expose both names so pages from either original app work unchanged
    loading,
    isLoading: loading,
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
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
