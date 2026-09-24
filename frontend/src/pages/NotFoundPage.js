import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="auth-wrapper">
      <div className="card empty-state" style={{ maxWidth: '440px' }}>
        <AlertCircle size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>404 - Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          The page or support ticket resource you are looking for does not exist or has been moved.
        </p>
        <Link to="/login" className="btn btn-primary">
          <Home size={16} />
          <span>Go to Home / Login</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
