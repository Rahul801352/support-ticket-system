import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LifeBuoy, Ticket, PlusCircle, LogOut, ShieldCheck, User } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAgent = user?.role === 'agent';

  return (
    <header className="navbar">
      <Link to={isAgent ? '/agent/dashboard' : '/customer/dashboard'} className="navbar-brand">
        <LifeBuoy size={24} color="#2563eb" />
        <span>SupportDesk</span>
      </Link>

      <nav className="navbar-nav">
        {isAgent ? (
          <>
            <Link
              to="/agent/dashboard"
              className={`nav-link ${location.pathname === '/agent/dashboard' ? 'active' : ''}`}
            >
              <Ticket size={18} />
              <span>Agent Dashboard</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/customer/dashboard"
              className={`nav-link ${location.pathname === '/customer/dashboard' ? 'active' : ''}`}
            >
              <Ticket size={18} />
              <span>My Tickets</span>
            </Link>
            <Link
              to="/tickets/new"
              className={`nav-link ${location.pathname === '/tickets/new' ? 'active' : ''}`}
            >
              <PlusCircle size={18} />
              <span>Create Ticket</span>
            </Link>
          </>
        )}

        <div className="user-profile-widget">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</span>
            <span className={`badge badge-role-${user?.role}`}>
              {isAgent ? <ShieldCheck size={12} /> : <User size={12} />}
              {user?.role}
            </span>
          </div>

          <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
