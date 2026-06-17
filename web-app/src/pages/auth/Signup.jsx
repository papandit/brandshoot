// Web port of mobile auth/SignupScreen.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import './auth.css';

export default function Signup() {
  const { signup, googleLogin } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (phone.trim().length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), phone.trim(), password);
    } catch (error) {
      toast.error(error.message || 'Signup Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleToken = async (idToken) => {
    try {
      await googleLogin(idToken);
    } catch (error) {
      toast.error(error.message || 'Google Sign-In Failed');
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
            <label className="input-label">Phone Number</label>
            <div className="input-wrapper">
              <IoCallOutline />
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
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

        <div className="auth-divider">
          <div className="line" />
          <span>OR</span>
          <div className="line" />
        </div>

        <GoogleSignInButton onIdToken={handleGoogleToken} />

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
