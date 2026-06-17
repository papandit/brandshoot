// Register page — original "Create Account" UI, email/password only.
// (Name is required by the backend; phone & Google sign-in removed.)
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  IoPersonOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

export default function Signup() {
  const { signup, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // New accounts are always users, but honor an existing session too.
  useEffect(() => {
    if (isAuthenticated) navigate(isAdmin ? '/dashboard' : '/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    // signup(name, email, phone, password) — phone left empty (optional on the backend)
    const result = await signup(name.trim(), email.trim(), '', password);
    setLoading(false);

    if (result.success) {
      toast.success('Account created!');
      navigate('/', { replace: true });
    } else {
      toast.error(result.error || 'Signup failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Sign up to get started</p>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div className="input-wrapper">
              <IoPersonOutline />
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <div className="input-wrapper">
              <IoMailOutline />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <IoLockClosedOutline />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </button>
            </div>
            <span className="input-hint">
              Must be at least 8 characters with uppercase, lowercase, number and special character
            </span>
          </div>

          <button type="submit" className="app-button primary" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link className="link" to="/login">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
