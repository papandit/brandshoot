import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon gradient-bg">
            <LogIn size={32} color="white" />
          </div>
          <h1 className="login-title">Brand Shoot Admin</h1>
          <p className="login-subtitle">Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <div className="login-error">{error}</div>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
