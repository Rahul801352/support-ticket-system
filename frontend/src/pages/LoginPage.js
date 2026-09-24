import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LifeBuoy, LogIn, ShieldAlert, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(email, password);
      const from = location.state?.from?.pathname || (user.role === 'agent' ? '/agent/dashboard' : '/customer/dashboard');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCustomer = () => {
    setEmail('john@example.com');
    setPassword('Password123!');
    setError('');
  };

  const fillDemoAgent = () => {
    setEmail('agent.sarah@example.com');
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: '#eff6ff', borderRadius: '50%', marginBottom: '0.5rem' }}>
            <LifeBuoy size={36} color="#2563eb" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Welcome to SupportDesk</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Log in to manage or raise support tickets
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            <LogIn size={18} />
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo Account Fill Helpers */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sparkles size={14} color="#d97706" /> Quick Demo Credentials:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={fillDemoCustomer}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              Customer Demo
            </button>
            <button
              type="button"
              onClick={fillDemoAgent}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              Support Agent Demo
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have a customer account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
